import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { TrackingEvent } from '@data-snack/core';
import { ServerTracker } from '@data-snack/tracking';
import { z } from 'zod';

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  gtmContainerId: process.env.GTM_CONTAINER_ID,
  corsOrigin: process.env.CORS_ORIGIN || 'https://data-snack.com',
  debug: process.env.DEBUG === 'true',
};

// Validation schemas
const TrackingEventSchema = z.object({
  type: z.string(),
  name: z.string(),
  properties: z.record(z.unknown()).default({}),
  context: z.record(z.unknown()).default({}),
  sessionId: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

const BatchTrackingSchema = z.object({
  events: z.array(TrackingEventSchema),
});

// Initialize tracking
const tracker = new ServerTracker({
  enableGTMServer: true,
  enableDatabase: true,
  enableAnalytics: true,
  debug: config.debug,
});

// Create Fastify instance
const app = fastify({ 
  logger: {
    level: config.debug ? 'debug' : 'info',
    ...(config.environment === 'production' && {
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  },
});

// Register plugins
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com"],
    },
  },
});

app.register(cors, {
  origin: config.environment === 'development' 
    ? true 
    : [config.corsOrigin, 'https://data-snack.com', 'https://*.data-snack.com'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
});

app.register(rateLimit, {
  max: 1000, // 1000 requests per minute per IP
  timeWindow: '1 minute',
});

// Health check endpoint
app.get('/health', async () => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    environment: config.environment,
  };
});

// GTM Server-Side endpoint (compatible with GTM Server)
app.post('/gtm/collect', async (request, reply) => {
  try {
    const eventData = request.body as any;
    
    // Convert GTM format to our format
    const trackingEvent = TrackingEvent.create(
      eventData.event_name || eventData.en || 'unknown',
      eventData.event_name || eventData.en || 'unknown',
      eventData,
      {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        url: eventData.page_location || eventData.dl,
        referrer: eventData.page_referrer || eventData.dr,
      }
    );

    await tracker.track(trackingEvent);

    // GTM Server expects a 204 No Content response
    reply.code(204);
    return;
  } catch (error) {
    app.log.error('GTM collect endpoint error:', error);
    reply.code(400);
    return { error: 'Invalid request' };
  }
});

// Main tracking endpoint
app.post<{
  Body: z.infer<typeof BatchTrackingSchema>
}>('/track', {
  schema: {
    body: BatchTrackingSchema,
  },
}, async (request, reply) => {
  try {
    const { events } = request.body;
    
    // Convert and enhance events
    const trackingEvents = events.map(eventData => {
      const event = TrackingEvent.create(
        eventData.type as any,
        eventData.name,
        eventData.properties,
        {
          ...eventData.context,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
        }
      ).withSession(eventData.sessionId);

      if (eventData.userId) {
        return event.withUser(eventData.userId as any);
      }
      
      return event;
    });

    await tracker.trackBatch(trackingEvents);

    reply.code(204);
    return;
  } catch (error) {
    app.log.error('Track endpoint error:', error);
    reply.code(400);
    return { error: 'Invalid request' };
  }
});

// Single event tracking endpoint
app.post<{
  Body: z.infer<typeof TrackingEventSchema>
}>('/track/single', {
  schema: {
    body: TrackingEventSchema,
  },
}, async (request, reply) => {
  try {
    const eventData = request.body;
    
    let event = TrackingEvent.create(
      eventData.type as any,
      eventData.name,
      eventData.properties,
      {
        ...eventData.context,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }
    ).withSession(eventData.sessionId);

    if (eventData.userId) {
      event = event.withUser(eventData.userId as any);
    }

    await tracker.track(event);

    reply.code(204);
    return;
  } catch (error) {
    app.log.error('Single track endpoint error:', error);
    reply.code(400);
    return { error: 'Invalid request' };
  }
});

// Debug endpoint (development only)
if (config.environment === 'development') {
  app.get('/debug/events', async (request, reply) => {
    // This would return recent events for debugging
    // In production, this should be removed or secured
    return {
      message: 'Debug endpoint - events would be listed here',
      timestamp: new Date().toISOString(),
    };
  });
}

// Consent management endpoint
app.post('/consent', async (request, reply) => {
  const { consent, userId, sessionId } = request.body as any;
  
  try {
    let consentEvent = TrackingEvent.create(
      'consent_change',
      'consent_update',
      { 
        consent,
        timestamp: Date.now(),
      },
      {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }
    ).withSession(sessionId);

    if (userId) {
      consentEvent = consentEvent.withUser(userId as any);
    }

    await tracker.track(consentEvent);

    reply.code(204);
    return;
  } catch (error) {
    app.log.error('Consent endpoint error:', error);
    reply.code(400);
    return { error: 'Invalid consent data' };
  }
});

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error('Unhandled error:', error);
  
  reply.code(500).send({
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(config.debug && { details: error.message }),
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    await app.listen({ 
      port: config.port, 
      host: config.host 
    });
    
    app.log.info(`🚀 Tracking server running on ${config.host}:${config.port}`);
    app.log.info(`📊 Environment: ${config.environment}`);
    app.log.info(`🔍 Debug mode: ${config.debug ? 'enabled' : 'disabled'}`);
    
    if (config.gtmContainerId) {
      app.log.info(`📈 GTM Container ID: ${config.gtmContainerId}`);
    }
  } catch (error) {
    app.log.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
