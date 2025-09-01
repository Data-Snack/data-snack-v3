'use client';

import { useEffect } from 'react';
import { useDataSnack } from '@data-snack/tracking/react';

interface PageTrackingProps {
  pageName: string;
  properties?: Record<string, any>;
}

export function PageTracking({ pageName, properties = {} }: PageTrackingProps) {
  const { track } = useDataSnack();

  useEffect(() => {
    track('page_view', {
      page: pageName,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      ...properties,
    });
  }, [pageName, track, properties]);

  return null;
}
