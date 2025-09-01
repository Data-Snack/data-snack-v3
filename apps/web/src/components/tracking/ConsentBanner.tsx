'use client';

import { ConsentBanner as TrackingConsentBanner } from '@data-snack/tracking/react';

export function ConsentBanner() {
  return (
    <TrackingConsentBanner
      onAcceptAll={() => {
        // Analytics: Track full consent
        console.log('User granted full consent');
      }}
      onDeclineAll={() => {
        // Analytics: Track minimal consent
        console.log('User declined tracking');
      }}
      onCustomize={() => {
        // Open consent customization
        console.log('User wants to customize consent');
      }}
    />
  );
}
