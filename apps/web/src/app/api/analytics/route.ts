import { NextRequest, NextResponse } from 'next/server';
import { createServerDatabaseClient } from '@data-snack/database';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://data-snack.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    const db = createServerDatabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '1h';
    
    // Calculate time range
    const now = new Date();
    let startTime: Date;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }
    
    // Query analytics data
    const [eventsResult, usersResult, consentResult] = await Promise.all([
      // Total events in timeframe
      db
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('time', startTime.toISOString()),
      
      // Unique users in timeframe  
      db
        .from('events')
        .select('user_id', { count: 'exact', head: true })
        .gte('time', startTime.toISOString())
        .not('user_id', 'is', null),
      
      // Consent statistics
      db
        .from('events')
        .select('consent_state')
        .eq('event_type', 'consent_change')
        .gte('time', startTime.toISOString())
        .limit(100),
    ]);
    
    // Calculate consent statistics
    const consentStats = {
      total: consentResult.data?.length || 0,
      analytics: 0,
      marketing: 0,
      personalization: 0,
    };
    
    consentResult.data?.forEach((event: any) => {
      if (event.consent_state?.analytics) consentStats.analytics++;
      if (event.consent_state?.marketing) consentStats.marketing++;
      if (event.consent_state?.personalization) consentStats.personalization++;
    });
    
    // Get recent events by type
    const eventsByType = await db
      .from('events')
      .select('event_type')
      .gte('time', startTime.toISOString())
      .limit(1000);
    
    const eventTypeStats = eventsByType.data?.reduce((acc: Record<string, number>, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Calculate privacy score (percentage of users with analytics consent)
    const privacyScore = consentStats.total > 0 
      ? Math.round((consentStats.analytics / consentStats.total) * 100)
      : 0;
    
    const response = {
      timeframe,
      timestamp: new Date().toISOString(),
      stats: {
        totalEvents: eventsResult.count || 0,
        uniqueUsers: usersResult.count || 0,
        privacyScore,
        dataPoints: (eventsResult.count || 0) * 5, // Estimate 5 data points per event
      },
      consent: {
        total: consentStats.total,
        analytics: consentStats.analytics,
        marketing: consentStats.marketing,
        personalization: consentStats.personalization,
      },
      eventTypes: eventTypeStats,
      health: {
        database: 'connected',
        lastUpdate: new Date().toISOString(),
      },
    };
    
    return NextResponse.json(response, {
      headers: corsHeaders,
    });
    
  } catch (error) {
    console.error('[API] Analytics error:', error);
    
    // Return mock data if database is not available
    const mockResponse = {
      timeframe: request.nextUrl.searchParams.get('timeframe') || '1h',
      timestamp: new Date().toISOString(),
      stats: {
        totalEvents: Math.floor(Math.random() * 10000) + 1000,
        uniqueUsers: Math.floor(Math.random() * 500) + 100,
        privacyScore: Math.floor(Math.random() * 40) + 60,
        dataPoints: Math.floor(Math.random() * 50000) + 10000,
      },
      consent: {
        total: Math.floor(Math.random() * 100) + 50,
        analytics: Math.floor(Math.random() * 70) + 20,
        marketing: Math.floor(Math.random() * 30) + 10,
        personalization: Math.floor(Math.random() * 40) + 15,
      },
      eventTypes: {
        page_view: Math.floor(Math.random() * 1000) + 500,
        click: Math.floor(Math.random() * 800) + 300,
        scroll: Math.floor(Math.random() * 600) + 200,
        consent_change: Math.floor(Math.random() * 50) + 10,
      },
      health: {
        database: 'mock-mode',
        lastUpdate: new Date().toISOString(),
        error: 'Database connection failed - showing mock data',
      },
    };
    
    return NextResponse.json(mockResponse, {
      headers: corsHeaders,
    });
  }
}
