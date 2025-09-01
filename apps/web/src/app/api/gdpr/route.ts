import { NextRequest, NextResponse } from 'next/server';
import { GDPRTracker } from '@data-snack/tracking';
import { z } from 'zod';

const GDPRRequestSchema = z.object({
  action: z.enum(['export', 'delete']),
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  reason: z.string().optional(),
});

const gdprTracker = new GDPRTracker({
  enableDatabase: true,
  debug: process.env.NODE_ENV === 'development',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://data-snack.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { action, userId, email, reason } = GDPRRequestSchema.parse(body);
    
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    switch (action) {
      case 'export': {
        // Request data export
        const exportData = await gdprTracker.requestDataExport(userId);
        
        // Log the export request
        console.log(`[GDPR] Data export requested for user ${userId} from IP ${clientIp}`);
        
        return NextResponse.json(
          {
            success: true,
            message: 'Data export completed',
            data: exportData,
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="data-export-${userId}-${Date.now()}.json"`,
            },
          }
        );
      }
      
      case 'delete': {
        // Request data deletion
        await gdprTracker.requestDataDeletion(userId);
        
        // Log the deletion request
        console.log(`[GDPR] Data deletion requested for user ${userId} from IP ${clientIp}. Reason: ${reason || 'Not specified'}`);
        
        return NextResponse.json(
          {
            success: true,
            message: 'Data deletion request submitted. Your data will be anonymized within 30 days.',
            userId,
            requestedAt: new Date().toISOString(),
            deletionSchedule: 'Within 30 days',
          },
          {
            headers: corsHeaders,
          }
        );
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        );
    }
    
  } catch (error) {
    console.error('[API] GDPR request error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors,
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process GDPR request',
        message: 'Please try again or contact support if the problem persists.',
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// Get GDPR information
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { 
        gdprInfo: {
          rights: [
            'Right to be informed',
            'Right of access',
            'Right to rectification',
            'Right to erasure (right to be forgotten)',
            'Right to restrict processing',
            'Right to data portability',
            'Right to object',
            'Rights related to automated decision making including profiling',
          ],
          dataRetention: '90 days for personal data, indefinite for anonymized data',
          contactEmail: 'privacy@data-snack.com',
          lastUpdated: '2024-12-01',
        }
      },
      {
        headers: corsHeaders,
      }
    );
  }
  
  // For specific user, show their GDPR status
  // In a real implementation, you'd check the database
  return NextResponse.json(
    {
      userId,
      gdprStatus: {
        hasActiveData: true,
        lastExport: null,
        deletionRequested: false,
        consentLastUpdated: new Date().toISOString(),
      },
      availableActions: ['export', 'delete'],
    },
    {
      headers: corsHeaders,
    }
  );
}
