import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DataSnackSDK, SDKConfig, ConsentState } from '../sdk/DataSnackSDK';

interface DataSnackContextValue {
  sdk: DataSnackSDK | null;
  isInitialized: boolean;
  consent: ConsentState | null;
}

const DataSnackContext = createContext<DataSnackContextValue | null>(null);

interface DataSnackProviderProps {
  config: SDKConfig;
  children: ReactNode;
  onInitialized?: (sdk: DataSnackSDK) => void;
  onError?: (error: Error) => void;
}

export function DataSnackProvider({ 
  config, 
  children, 
  onInitialized, 
  onError 
}: DataSnackProviderProps) {
  const [sdk, setSdk] = useState<DataSnackSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const sdkInstance = new DataSnackSDK(config);
    try {
      setSdk(sdkInstance);
      setConsent(sdkInstance.getConsent());
      setIsInitialized(true);

      if (onInitialized) {
        onInitialized(sdkInstance);
      }

      // Listen for consent changes
      const originalSetConsent = sdkInstance.setConsent.bind(sdkInstance);
      sdkInstance.setConsent = (newConsent: Partial<ConsentState>) => {
        originalSetConsent(newConsent);
        setConsent(sdkInstance.getConsent());
      };

    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error('Failed to initialize DataSnack SDK:', error);
      }
    }

    return () => sdkInstance.destroy();
  }, [config]);

  return (
    <DataSnackContext.Provider value={{ sdk, isInitialized, consent }}>
      {children}
    </DataSnackContext.Provider>
  );
}

export function useDataSnackContext(): DataSnackContextValue {
  const context = useContext(DataSnackContext);
  if (!context) {
    throw new Error('useDataSnackContext must be used within a DataSnackProvider');
  }
  return context;
}

// HOC for automatic tracking
export interface WithTrackingProps {
  autoTrack?: {
    pageView?: boolean;
    clicks?: boolean;
    scroll?: boolean;
    biometrics?: boolean;
  };
}

export function withTracking<P extends object>(
  Component: React.ComponentType<P>,
  trackingConfig?: WithTrackingProps['autoTrack']
) {
  return function TrackedComponent(props: P & WithTrackingProps) {
    const { sdk } = useDataSnackContext();
    const autoTrack = props.autoTrack || trackingConfig;

    useEffect(() => {
      if (!sdk || !autoTrack) return;

      const cleanupFunctions: (() => void)[] = [];

      // Page view tracking
      if (autoTrack.pageView) {
        sdk.page(Component.displayName || Component.name || 'Unknown');
      }

      // Click tracking
      if (autoTrack.clicks) {
        const handleClick = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          const elementName = target.tagName.toLowerCase();
          const elementId = target.id ? `#${target.id}` : '';
          
          sdk.click(`${elementName}${elementId}`, {
            x: event.clientX,
            y: event.clientY,
            component: Component.displayName || Component.name,
          });
        };

        document.addEventListener('click', handleClick);
        cleanupFunctions.push(() => document.removeEventListener('click', handleClick));
      }

      // Scroll tracking
      if (autoTrack.scroll) {
        let lastDepth = 0;
        
        const handleScroll = () => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = Math.round((scrollTop / docHeight) * 100);

          if (scrollPercent > lastDepth + 25) {
            sdk.scroll(scrollPercent, {
              component: Component.displayName || Component.name,
            });
            lastDepth = scrollPercent;
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        cleanupFunctions.push(() => window.removeEventListener('scroll', handleScroll));
      }

      // Biometric tracking
      if (autoTrack.biometrics) {
        const pattern: Array<{x: number; y: number; timestamp: number}> = [];
        
        const handleMouseMove = (event: MouseEvent) => {
          if (pattern.length < 20) { // Limit pattern size
            pattern.push({
              x: event.clientX,
              y: event.clientY,
              timestamp: Date.now(),
            });
          }
          
          if (pattern.length === 20) {
            sdk.trackClickDNA(pattern);
            pattern.length = 0;
          }
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        cleanupFunctions.push(() => document.removeEventListener('mousemove', handleMouseMove));
      }

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    }, [sdk, autoTrack]);

    return <Component {...props} />;
  };
}

// Component for consent banner/modal
interface ConsentBannerProps {
  onAcceptAll?: () => void;
  onDeclineAll?: () => void;
  onCustomize?: () => void;
  className?: string;
}

export function ConsentBanner({ 
  onAcceptAll, 
  onDeclineAll, 
  onCustomize,
  className = '' 
}: ConsentBannerProps) {
  const { sdk, consent } = useDataSnackContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (consent && !consent.analytics && !consent.marketing && !consent.personalization) {
      setIsVisible(true);
    }
  }, [consent]);

  const handleAcceptAll = () => {
    sdk?.setConsent({
      analytics: true,
      marketing: true,
      personalization: true,
    });
    setIsVisible(false);
    onAcceptAll?.();
  };

  const handleDeclineAll = () => {
    sdk?.setConsent({
      analytics: false,
      marketing: false,
      personalization: false,
    });
    setIsVisible(false);
    onDeclineAll?.();
  };

  const handleCustomize = () => {
    setIsVisible(false);
    onCustomize?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-black/90 text-white p-6 z-50 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold mb-2">🍪 Data Snack Tracking</h3>
        <p className="text-sm mb-4">
          We use cookies and tracking to improve your experience and show you how your data creates value.
          This is educational - we&apos;re transparent about everything we collect!
        </p>
        <div className="flex gap-3">
          <button 
            onClick={handleAcceptAll}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
          >
            Accept All
          </button>
          <button 
            onClick={handleDeclineAll}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium"
          >
            Decline All
          </button>
          <button 
            onClick={handleCustomize}
            className="border border-gray-400 hover:border-gray-300 px-4 py-2 rounded text-sm font-medium"
          >
            Customize
          </button>
        </div>
      </div>
    </div>
  );
}

// Debug component to show tracking activity
export function TrackingDebugger() {
  const { sdk, consent } = useDataSnackContext();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!sdk) return;

    // Override the track method to capture events
    const originalTrack = sdk.track.bind(sdk);
    sdk.track = (type: any, properties: any, context: any) => {
      const event = { type, properties, context, timestamp: Date.now() };
      setEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
      return originalTrack(type, properties, context);
    };
  }, [sdk]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-0 right-0 w-80 bg-black/95 text-white p-3 text-xs z-50 max-h-screen overflow-y-auto">
      <h4 className="font-bold mb-2">🔍 Tracking Debug</h4>
      
      <div className="mb-3">
        <h5 className="font-semibold text-yellow-400">Consent State:</h5>
        <pre className="text-xs">{JSON.stringify(consent, null, 2)}</pre>
      </div>
      
      <div>
        <h5 className="font-semibold text-green-400">Recent Events:</h5>
        {events.length === 0 && <p className="text-gray-400">No events yet</p>}
        {events.map((event, i) => (
          <div key={i} className="border-b border-gray-700 pb-2 mb-2">
            <div className="font-semibold text-blue-400">{event.type}</div>
            <div className="text-gray-300">
              {Object.keys(event.properties || {}).length > 0 && (
                <pre>{JSON.stringify(event.properties, null, 1)}</pre>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
