import { NextRequest, NextResponse } from 'next/server';
import { ServerTracker } from '@data-snack/tracking';
import { TrackingEvent } from '@data-snack/core';
import { z } from 'zod';

// Consent request schema
const ConsentRequestSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string(),
  consent: z.object({
    necessary: z.boolean().default(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
    personalization: z.boolean(),
  }),
  timestamp: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

const tracker = new ServerTracker({
  enableDatabase: true,
  debug: process.env.NODE_ENV === 'development',
});

const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'development' ? '*' : 'https://data-snack.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, consent, timestamp } = ConsentRequestSchema.parse(body);

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Create consent change event
    let consentEvent = TrackingEvent.create(
      'consent_change',
      'consent_updated',
      {
        consent,
        timestamp: timestamp || new Date().toISOString(),
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
      {
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ip: clientIp,
      },
    ).withSession(sessionId);

    if (userId) {
      consentEvent = consentEvent.withUser(userId as any);
    }

    // Track the consent change
    await tracker.track(consentEvent);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Consent preferences updated',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error('[API] Consent error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid consent data',
          details: error.errors,
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      { error: 'Failed to update consent' },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// Get current consent status (if we store it per user)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400, headers: corsHeaders },
    );
  }

  // In a real implementation, you'd fetch from database
  // For now, return default consent state
  const defaultConsent = {
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  };

  return NextResponse.json(
    {
      consent: defaultConsent,
      userId: userId || null,
      sessionId,
      timestamp: new Date().toISOString(),
    },
    {
      headers: corsHeaders,
    },
  );
}
