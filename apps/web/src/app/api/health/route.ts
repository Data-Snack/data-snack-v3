import { NextResponse } from 'next/server';
import { createServerDatabaseClient } from '@data-snack/database';

export async function GET() {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'data-snack-api',
    version: process.env.npm_package_version || '0.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      memory: 'unknown',
      tracking: 'unknown',
    },
  };
  
  try {
    // Check database connection
    const db = createServerDatabaseClient();
    const { error } = await db.from('users').select('id').limit(1);
    health.checks.database = error ? 'unhealthy' : 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
  }
  
  // Check memory usage
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    health.checks.memory = memUsageMB < 512 ? 'healthy' : 'warning';
  } catch (error) {
    health.checks.memory = 'unhealthy';
  }
  
  // Check tracking service
  try {
    const trackingUrl = process.env.TRACKING_SERVER_URL;
    if (trackingUrl) {
      const response = await fetch(`${trackingUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      }).catch(() => null);
      health.checks.tracking = response?.ok ? 'healthy' : 'unhealthy';
    } else {
      health.checks.tracking = 'not-configured';
    }
  } catch (error) {
    health.checks.tracking = 'unhealthy';
  }
  
  // Determine overall status
  const hasUnhealthy = Object.values(health.checks).includes('unhealthy');
  const hasWarning = Object.values(health.checks).includes('warning');
  
  if (hasUnhealthy) {
    health.status = 'unhealthy';
  } else if (hasWarning) {
    health.status = 'warning';
  } else {
    health.status = 'healthy';
  }
  
  const responseTime = Date.now() - startTime;
  health.responseTime = `${responseTime}ms`;
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}
