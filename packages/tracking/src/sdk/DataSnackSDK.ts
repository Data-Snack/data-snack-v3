import { TrackingEvent } from '@data-snack/core';
import type { EventType, EventContext, EventProperties } from '@data-snack/core';

export interface SDKConfig {
  endpoint: string;
  apiKey?: string;
  debug?: boolean;
  batchSize?: number;
  flushInterval?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

interface QueuedEvent extends TrackingEvent {
  retries: number;
}

export class DataSnackSDK {
  private config: SDKConfig;
  private queue: QueuedEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private consent: ConsentState = {
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  };
  private flushTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor(config: SDKConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      maxRetries: 3,
      timeout: 10000, // 10 seconds
      debug: false,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private initialize(): void {
    // Set up periodic flushing
    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }

    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true); // Force flush when page becomes hidden
        }
      });

      // Handle beforeunload
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });
    }

    // Handle online/offline status
    if (typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flush(); // Flush queued events when back online
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }

    // Auto-track page views (if in browser)
    if (typeof window !== 'undefined') {
      this.track('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      });
    }
  }

  // Core tracking methods
  public track(
    type: EventType | string,
    properties: EventProperties = {},
    context: Partial<EventContext> = {}
  ): void {
    // Check consent
    if (!this.canTrack(type as EventType)) {
      if (this.config.debug) {
        console.warn(`[DataSnack SDK] Event blocked by consent: ${type}`);
      }
      return;
    }

    const event = TrackingEvent.create(
      type as EventType,
      type as string,
      properties,
      {
        ...this.getDefaultContext(),
        ...context,
      }
    ).withSession(this.sessionId);

    if (this.userId) {
      event.withUser(this.userId as any);
    }

    const queuedEvent: QueuedEvent = {
      ...event,
      retries: 0,
    };

    this.queue.push(queuedEvent);

    if (this.config.debug) {
      console.log('[DataSnack SDK] Event queued:', queuedEvent);
    }

    // Auto-flush if batch size reached
    if (this.queue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  // Convenience tracking methods
  public page(name: string, properties: EventProperties = {}): void {
    this.track('page_view', {
      page: name,
      ...properties,
    });
  }

  public click(element: string, properties: EventProperties = {}): void {
    this.track('click', {
      element,
      ...properties,
    });
  }

  public scroll(depth: number, properties: EventProperties = {}): void {
    this.track('scroll', {
      depth,
      ...properties,
    });
  }

  public snackStart(snackId: string, properties: EventProperties = {}): void {
    this.track('snack_start', {
      snackId,
      ...properties,
    });
  }

  public snackComplete(snackId: string, properties: EventProperties = {}): void {
    this.track('snack_complete', {
      snackId,
      ...properties,
    });
  }

  public share(type: string, properties: EventProperties = {}): void {
    this.track('share', {
      shareType: type,
      ...properties,
    });
  }

  // Advanced tracking methods for behavioral analysis
  public trackClickDNA(pattern: {
    x: number;
    y: number;
    timestamp: number;
    pressure?: number;
    element?: string;
  }[]): void {
    if (!this.consent.personalization) return;

    this.track('click_dna', {
      pattern,
      patternLength: pattern.length,
      duration: pattern[pattern.length - 1].timestamp - pattern[0].timestamp,
    });
  }

  public trackScrollBehavior(behavior: {
    scrollY: number;
    timestamp: number;
    velocity?: number;
    direction?: 'up' | 'down';
  }[]): void {
    if (!this.consent.analytics) return;

    this.track('scroll_behavior', {
      behavior,
      totalScrolled: Math.max(...behavior.map(b => b.scrollY)),
      duration: behavior[behavior.length - 1].timestamp - behavior[0].timestamp,
    });
  }

  public trackPrivacyLeaks(leaks: {
    type: string;
    value: string;
    uniqueness: number;
    description: string;
  }[]): void {
    this.track('privacy_leak', {
      leaks,
      leakCount: leaks.length,
      totalUniqueness: leaks.reduce((sum, leak) => sum + leak.uniqueness, 0) / leaks.length,
    });
  }

  // Identity management
  public identify(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    
    if (this.consent.analytics) {
      this.track('identify', {
        userId,
        traits,
      });
    }
  }

  public reset(): void {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.queue = [];
  }

  // Consent management
  public setConsent(consent: Partial<ConsentState>): void {
    const oldConsent = { ...this.consent };
    this.consent = { ...this.consent, ...consent };

    // Track consent change
    this.track('consent_change', {
      oldConsent,
      newConsent: this.consent,
      changedCategories: Object.keys(consent),
    });

    if (this.config.debug) {
      console.log('[DataSnack SDK] Consent updated:', this.consent);
    }
  }

  public getConsent(): ConsentState {
    return { ...this.consent };
  }

  private canTrack(eventType: EventType): boolean {
    // Necessary events always allowed
    if (['page_view', 'consent_change'].includes(eventType)) {
      return true;
    }

    // Analytics events
    if (['snack_start', 'snack_complete', 'click', 'scroll'].includes(eventType)) {
      return this.consent.analytics;
    }

    // Marketing events
    if (['share'].includes(eventType)) {
      return this.consent.marketing;
    }

    // Personalization events
    if (['click_dna', 'scroll_behavior', 'privacy_leak'].includes(eventType)) {
      return this.consent.personalization;
    }

    return this.consent.analytics; // Default to analytics consent
  }

  // Flushing and network
  public async flush(force: boolean = false): Promise<void> {
    if (this.queue.length === 0) return;
    if (!this.isOnline && !force) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      await this.sendEvents(eventsToSend);
      
      if (this.config.debug) {
        console.log(`[DataSnack SDK] Successfully sent ${eventsToSend.length} events`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[DataSnack SDK] Failed to send events:', error);
      }

      // Re-queue events with retry logic
      eventsToSend.forEach(event => {
        if (event.retries < (this.config.maxRetries || 3)) {
          event.retries++;
          this.queue.unshift(event);
        }
      });
    }
  }

  private async sendEvents(events: QueuedEvent[]): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ events }),
        signal: controller.signal,
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getDefaultContext(): Partial<EventContext> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true); // Final flush
  }
}

// Singleton instance for global usage
let globalSDK: DataSnackSDK | null = null;

export function initDataSnack(config: SDKConfig): DataSnackSDK {
  globalSDK = new DataSnackSDK(config);
  return globalSDK;
}

export function getDataSnack(): DataSnackSDK {
  if (!globalSDK) {
    throw new Error('DataSnack SDK not initialized. Call initDataSnack() first.');
  }
  return globalSDK;
}

// Convenience functions for global usage
export const track = (type: EventType | string, properties?: EventProperties, context?: Partial<EventContext>) => {
  getDataSnack().track(type, properties, context);
};

export const page = (name: string, properties?: EventProperties) => {
  getDataSnack().page(name, properties);
};

export const click = (element: string, properties?: EventProperties) => {
  getDataSnack().click(element, properties);
};

export const identify = (userId: string, traits?: Record<string, any>) => {
  getDataSnack().identify(userId, traits);
};

export const setConsent = (consent: Partial<ConsentState>) => {
  getDataSnack().setConsent(consent);
};
