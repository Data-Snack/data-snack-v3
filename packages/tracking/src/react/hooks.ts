import { useEffect, useCallback, useRef } from 'react';
import { DataSnackSDK, ConsentState } from '../sdk/DataSnackSDK';
import type { TrackingEvent } from '@data-snack/core';

type EventType = TrackingEvent['type'];
type EventProperties = TrackingEvent['properties'];
type EventContext = TrackingEvent['context'];

// React Hook für DataSnack SDK
export function useDataSnack(sdk?: DataSnackSDK) {
  const sdkRef = useRef<DataSnackSDK | null>(sdk || null);
  useEffect(() => { sdkRef.current = sdk || null; }, [sdk]);

  const track = useCallback((
    type: EventType | string,
    properties?: EventProperties,
    context?: Partial<EventContext>
  ) => {
    sdkRef.current?.track(type, properties, context);
  }, []);

  const page = useCallback((name: string, properties?: EventProperties) => {
    sdkRef.current?.page(name, properties);
  }, []);

  const click = useCallback((element: string, properties?: EventProperties) => {
    sdkRef.current?.click(element, properties);
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    sdkRef.current?.identify(userId, traits);
  }, []);

  const setConsent = useCallback((consent: Partial<ConsentState>) => {
    sdkRef.current?.setConsent(consent);
  }, []);

  const getConsent = useCallback(() => {
    return sdkRef.current?.getConsent();
  }, []);

  const scroll = useCallback((depth: number, properties?: EventProperties) => {
    sdkRef.current?.scroll(depth, properties);
  }, []);

  return {
    track,
    page,
    click,
    scroll,
    identify,
    setConsent,
    getConsent,
    sdk: sdkRef.current,
  };
}

// Hook for automatic page view tracking
export function usePageTracking(pageName?: string) {
  const { page } = useDataSnack();

  useEffect(() => {
    if (pageName) {
      page(pageName);
    }
  }, [pageName, page]);
}

// Hook for click tracking with automatic element detection
export function useClickTracking() {
  const { click } = useDataSnack();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementName = target.tagName.toLowerCase();
      const elementId = target.id ? `#${target.id}` : '';
      const elementClass = target.className ? `.${target.className.split(' ')[0]}` : '';
      const elementText = target.textContent?.slice(0, 50) || '';

      click(`${elementName}${elementId}${elementClass}`, {
        x: event.clientX,
        y: event.clientY,
        text: elementText,
        timestamp: Date.now(),
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [click]);
}

// Hook for scroll tracking
export function useScrollTracking(threshold: number = 25) {
  const { scroll } = useDataSnack();
  const lastDepthRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = Math.round((scrollTop / docHeight) * 100);

          // Only track at threshold intervals
          if (scrollPercent > lastDepthRef.current + threshold) {
            scroll(scrollPercent, {
              scrollY: scrollTop,
              docHeight,
              timestamp: Date.now(),
            });
            lastDepthRef.current = scrollPercent;
          }

          ticking = false;
        });
      }
      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scroll, threshold]);
}

// Hook for snack lifecycle tracking
export function useSnackTracking(snackId: string) {
  const { track } = useDataSnack();
  const startTimeRef = useRef<number | null>(null);

  const start = useCallback((properties?: EventProperties) => {
    startTimeRef.current = Date.now();
    track('snack_start', {
      snackId,
      timestamp: startTimeRef.current,
      ...properties,
    });
  }, [track, snackId]);

  const complete = useCallback((results?: any, properties?: EventProperties) => {
    const duration = startTimeRef.current ? Date.now() - startTimeRef.current : null;
    track('snack_complete', {
      snackId,
      results,
      duration,
      timestamp: Date.now(),
      ...properties,
    });
  }, [track, snackId]);

  const abandon = useCallback((reason?: string, properties?: EventProperties) => {
    const duration = startTimeRef.current ? Date.now() - startTimeRef.current : null;
    track('snack_abandon', {
      snackId,
      reason,
      duration,
      timestamp: Date.now(),
      ...properties,
    });
  }, [track, snackId]);

  const step = useCallback((stepName: string, stepData?: any, properties?: EventProperties) => {
    track('snack_step', {
      snackId,
      stepName,
      stepData,
      timestamp: Date.now(),
      ...properties,
    });
  }, [track, snackId]);

  return {
    start,
    complete,
    abandon,
    step,
  };
}

// Hook for behavioral biometrics tracking
export function useBiometricTracking() {
  const { track } = useDataSnack();

  const trackClickDNA = useCallback(() => {
    const pattern: Array<{x: number; y: number; timestamp: number; pressure?: number}> = [];
    
    const handleMouseDown = (event: MouseEvent) => {
      pattern.length = 0; // Reset pattern
      pattern.push({
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now(),
        pressure: (event as any).pressure || 0.5,
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (pattern.length > 0 && pattern.length < 10) { // Limit pattern size
        pattern.push({
          x: event.clientX,
          y: event.clientY,
          timestamp: Date.now(),
          pressure: (event as any).pressure || 0.5,
        });
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (pattern.length > 1) {
        pattern.push({
          x: event.clientX,
          y: event.clientY,
          timestamp: Date.now(),
          pressure: (event as any).pressure || 0.5,
        });

          const start = pattern[0];
          const end = pattern[pattern.length - 1];
          const duration = start && end ? end.timestamp - start.timestamp : 0;
          track('click_dna', {
            pattern,
            patternLength: pattern.length,
            duration,
          });
      }
      pattern.length = 0;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [track]);

  const trackKeyboardDNA = useCallback(() => {
    const keystrokes: Array<{key: string; timestamp: number; duration: number}> = [];
    const keyDownTimes = new Map<string, number>();

    const handleKeyDown = (event: KeyboardEvent) => {
      keyDownTimes.set(event.key, Date.now());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const downTime = keyDownTimes.get(event.key);
      if (downTime) {
        const duration = Date.now() - downTime;
        keystrokes.push({
          key: event.key.length === 1 ? 'char' : event.key, // Don't store actual characters
          timestamp: Date.now(),
          duration,
        });
        keyDownTimes.delete(event.key);

        // Send pattern after 10 keystrokes or 5 seconds
        if (keystrokes.length >= 10) {
          track('keyboard_dna', {
            pattern: keystrokes.splice(0, 10),
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Send remaining keystrokes after 5 seconds of inactivity
    const timeoutId = setTimeout(() => {
      if (keystrokes.length > 0) {
        track('keyboard_dna', {
          pattern: [...keystrokes],
        });
        keystrokes.length = 0;
      }
    }, 5000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      clearTimeout(timeoutId);
    };
  }, [track]);

  useEffect(() => {
    const cleanupClick = trackClickDNA();
    const cleanupKeyboard = trackKeyboardDNA();

    return () => {
      cleanupClick();
      cleanupKeyboard();
    };
  }, [trackClickDNA, trackKeyboardDNA]);
}

// Hook for consent management
export function useConsent() {
  const { setConsent, getConsent } = useDataSnack();

  const grantConsent = useCallback((categories: (keyof ConsentState)[]) => {
    const updates: Partial<ConsentState> = {};
    categories.forEach(category => {
      updates[category] = true;
    });
    setConsent(updates);
  }, [setConsent]);

  const revokeConsent = useCallback((categories: (keyof ConsentState)[]) => {
    const updates: Partial<ConsentState> = {};
    categories.forEach(category => {
      if (category !== 'necessary') { // Can't revoke necessary consent
        updates[category] = false;
      }
    });
    setConsent(updates);
  }, [setConsent]);

  const toggleConsent = useCallback((category: keyof ConsentState) => {
    if (category === 'necessary') return; // Can't toggle necessary consent
    
    const current = getConsent();
    if (current) {
      setConsent({ [category]: !current[category] });
    }
  }, [setConsent, getConsent]);

  return {
    setConsent,
    getConsent,
    grantConsent,
    revokeConsent,
    toggleConsent,
  };
}
