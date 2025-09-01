import { NextRequest, NextResponse } from 'next/server';
import { ServerTracker } from '@data-snack/tracking';
import { TrackingEvent } from '@data-snack/core';
import { z } from 'zod';

// Request validation schema
const TrackingRequestSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      properties: z.record(z.unknown()).default({}),
      context: z.record(z.unknown()).default({}),
      sessionId: z.string(),
      userId: z.string().optional(),
      timestamp: z.string().datetime().optional(),
    }),
  ),
});

// Initialize server tracker
const tracker = new ServerTracker({
  enableDatabase: true,
  enableGTMServer: false, // We handle GTM forwarding separately
  enableAnalytics: true,
  debug: process.env.NODE_ENV === 'development',
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'development' ? '*' : 'https://data-snack.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Main tracking endpoint
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { events } = TrackingRequestSchema.parse(body);

    // Get client info from headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Convert to TrackingEvent instances
    const trackingEvents = events.map(eventData => {
      const event = TrackingEvent.create(
        eventData.type as any,
        eventData.name,
        eventData.properties,
        {
          ...eventData.context,
          userAgent,
          ip: clientIp,
          timestamp: eventData.timestamp || new Date().toISOString(),
          // Add server-side context
          serverTimestamp: new Date().toISOString(),
          origin: request.headers.get('origin') || 'unknown',
          referer: request.headers.get('referer') || '',
        },
      ).withSession(eventData.sessionId);

      if (eventData.userId) {
        return event.withUser(eventData.userId as any);
      }

      return event;
    });

    // Track events using server tracker
    await tracker.trackBatch(trackingEvents);

    // Return success response
    return new NextResponse(null, {
      status: 204, // No Content
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API] Tracking error:', error);

    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error.errors,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'tracking-api',
      version: process.env.npm_package_version || '0.0.0',
    },
    {
      headers: corsHeaders,
    },
  );
}
