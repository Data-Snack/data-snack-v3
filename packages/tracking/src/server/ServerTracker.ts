import { TrackingEvent } from '@data-snack/core';
import type { EventType } from '@data-snack/core';
import { createServerDatabaseClient } from '@data-snack/database';

export interface ServerTrackingConfig {
  enableGTMServer?: boolean;
  enableDatabase?: boolean;
  enableAnalytics?: boolean;
  debug?: boolean;
}

export class ServerTracker {
  private config: ServerTrackingConfig;
  private db;

  constructor(config: ServerTrackingConfig = {}) {
    this.config = {
      enableGTMServer: true,
      enableDatabase: true,
      enableAnalytics: true,
      debug: false,
      ...config,
    };

    if (this.config.enableDatabase) {
      this.db = createServerDatabaseClient();
    }
  }

  async track(event: TrackingEvent): Promise<void> {
    try {
      // Add server timestamp
      const serverEvent = event.withServerTimestamp();

      // Store in database
      if (this.config.enableDatabase && this.db) {
        await this.db.from('events').insert({
          time: serverEvent.timestamp.toISOString(),
          user_id: serverEvent.userId,
          session_id: serverEvent.sessionId,
          event_type: serverEvent.type,
          event_name: serverEvent.name,
          properties: serverEvent.properties,
          context: serverEvent.context,
          server_timestamp: new Date().toISOString(),
          is_anonymous: !serverEvent.userId,
        });
      }

      // Forward to GTM Server-Side
      if (this.config.enableGTMServer) {
        await this.forwardToGTMServer(serverEvent);
      }

      if (this.config.debug) {
        console.log('[ServerTracker] Event processed:', serverEvent);
      }
    } catch (error) {
      console.error('[ServerTracker] Failed to process event:', error);
      throw error;
    }
  }

  async trackBatch(events: TrackingEvent[]): Promise<void> {
    const promises = events.map(event => this.track(event));
    await Promise.all(promises);
  }

  private async forwardToGTMServer(event: TrackingEvent): Promise<void> {
    const gtmServerUrl = process.env.GTM_SERVER_URL;
    if (!gtmServerUrl) return;

    try {
      const response = await fetch(`${gtmServerUrl}/gtm/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event.toJSON()),
      });

      if (!response.ok) {
        throw new Error(`GTM Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('[ServerTracker] Failed to forward to GTM Server:', error);
    }
  }

  // Utility methods for Next.js API routes
  static async handleTrackingRequest(
    request: Request,
    tracker: ServerTracker
  ): Promise<Response> {
    try {
      const { events } = await request.json();
      
      if (!Array.isArray(events)) {
        return new Response('Invalid request: events must be an array', { 
          status: 400 
        });
      }

      // Convert plain objects to TrackingEvent instances
      const trackingEvents = events.map(eventData => {
        return TrackingEvent.create(
          eventData.type,
          eventData.name,
          eventData.properties,
          eventData.context
        ).withSession(eventData.sessionId);
      });

      await tracker.trackBatch(trackingEvents);

      return new Response('OK', { status: 204 });
    } catch (error) {
      console.error('[ServerTracker] Request handling failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Privacy-compliant anonymous tracking
  static createAnonymousEvent(
    type: EventType,
    name: string,
    properties: Record<string, any> = {},
    request?: Request
  ): TrackingEvent {
    const context: Record<string, any> = {};

    if (request) {
      // Extract safe, anonymous context
      const userAgent = request.headers.get('user-agent');
      if (userAgent) {
        // Only store browser family, not full UA string
        context.browserFamily = userAgent.split(' ')[0];
      }

      // Anonymize IP address to /24 subnet
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwarded?.split(',')[0] || realIp || 'unknown';
      
      if (ip !== 'unknown' && ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
          context.ipSubnet = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        }
      }

      // Geographic region (if available from CDN headers)
      const country = request.headers.get('cf-ipcountry') || 
                     request.headers.get('x-vercel-ip-country');
      if (country && country !== 'unknown') {
        context.country = country;
      }
    }

    return TrackingEvent.create(type, name, properties, context);
  }
}

// Middleware for automatic server-side tracking
export function createTrackingMiddleware(tracker: ServerTracker) {
  return async (request: Request, response: Response, next: () => void) => {
    const startTime = Date.now();

    // Track page view for GET requests
    if (request.method === 'GET') {
      const anonymousEvent = ServerTracker.createAnonymousEvent(
        'page_view',
        'server_page_view',
        {
          path: new URL(request.url).pathname,
          method: request.method,
        },
        request
      );

      await tracker.track(anonymousEvent);
    }

    // Continue to next middleware
    await next();

    // Track response metrics
    const duration = Date.now() - startTime;
    const performanceEvent = ServerTracker.createAnonymousEvent(
      'page_view',
      'server_performance',
      {
        path: new URL(request.url).pathname,
        method: request.method,
        duration,
        // status: response.status, // If response is available
      },
      request
    );

    await tracker.track(performanceEvent);
  };
}

// Utility for tracking API usage
export async function trackAPIUsage(
  endpoint: string,
  method: string,
  duration: number,
  status: number,
  tracker: ServerTracker
): Promise<void> {
  const event = TrackingEvent.create(
    'api_call' as EventType,
    'api_usage',
    {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
    }
  );

  await tracker.track(event);
}

// GDPR compliance utilities
export class GDPRTracker extends ServerTracker {
  async requestDataExport(userId: string): Promise<any> {
    if (!this.db) throw new Error('Database not configured');

    // Collect all user data
    const [user, events, sessions] = await Promise.all([
      this.db.from('users').select('*').eq('id', userId).single(),
      this.db.from('events').select('*').eq('user_id', userId),
      this.db.from('snack_sessions').select('*').eq('user_id', userId),
    ]);

    return {
      user: user.data,
      events: events.data,
      sessions: sessions.data,
      exportedAt: new Date().toISOString(),
    };
  }

  async requestDataDeletion(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not configured');

    // Mark user for deletion
    await this.db
      .from('users')
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq('id', userId);

    // Schedule anonymization (would be handled by background job)
    await this.scheduleAnonymization(userId);
  }

  private async scheduleAnonymization(userId: string): Promise<void> {
    // This would typically enqueue a background job
    // For now, we'll call the anonymization function directly
    // In production, use a job queue like Bull/Agenda
    console.log(`[GDPRTracker] Scheduled anonymization for user ${userId}`);
    
    // Anonymize after 30 days (could be immediate for testing)
    setTimeout(async () => {
      await this.anonymizeUserData(userId);
    }, 1000 * 60 * 60 * 24 * 30); // 30 days
  }

  private async anonymizeUserData(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not configured');

    // Use the database function to anonymize user data
    await this.db.rpc('anonymize_user_data', { user_uuid: userId });

    console.log(`[GDPRTracker] Anonymized data for user ${userId}`);
  }
}
