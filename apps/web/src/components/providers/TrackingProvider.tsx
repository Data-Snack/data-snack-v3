'use client';

import { ReactNode } from 'react';
import { DataSnackProvider, TrackingDebugger } from '@data-snack/tracking';

interface TrackingProviderProps {
  children: ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const trackingConfig = {
    endpoint: '/api/track',
    debug: process.env.NODE_ENV === 'development',
    batchSize: 10,
    flushInterval: 5000,
    maxRetries: 3,
    timeout: 10000,
  };

  return (
    <DataSnackProvider
      config={trackingConfig}
      onInitialized={(sdk) => {
        console.log('🚀 Data Snack SDK initialized:', sdk);
        sdk.track('app_initialized', {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
          language: navigator.language,
        });
      }}
      onError={(error) => {
        console.error('🚨 Tracking error:', error);
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && <TrackingDebugger />}
    </DataSnackProvider>
  );
}
