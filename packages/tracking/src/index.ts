// Client-side SDK
export * from './sdk/DataSnackSDK';

// React integration
export * from './react/hooks';
export * from './react/provider';

// Export specific components from provider
export { 
  DataSnackProvider, 
  ConsentBanner, 
  TrackingDebugger,
  withTracking,
  useDataSnackContext 
} from './react/provider';

// Server-side tracking
export * from './server/ServerTracker';

// Re-export core types
export type { TrackingEvent, EventType, EventContext, EventProperties } from '@data-snack/core';
export type { WithTrackingProps } from './react/provider';
