import { TrackingEvent, EventType, EventProperties, EventContext } from '../../domain/entities/TrackingEvent';
import { ConsentCategory } from '../../domain/entities/User';

export interface EventStore {
  store(event: TrackingEvent): Promise<void>;
  publish(event: TrackingEvent): Promise<void>;
  getEvents(sessionId: string): Promise<TrackingEvent[]>;
}

export interface ConsentManager {
  checkConsent(userId: string | null | undefined): Promise<ConsentState>;
  updateConsent(userId: string, categories: ConsentCategory[]): Promise<void>;
}

export interface EventEnricher {
  enrich(event: TrackingEvent): Promise<TrackingEvent>;
}

interface ConsentState {
  hasAnalytics: boolean;
  hasMarketing: boolean;
  hasPersonalization: boolean;
}

export class TrackingService {
  constructor(
    private readonly eventStore: EventStore,
    private readonly consentManager: ConsentManager,
    private readonly enricher: EventEnricher,
  ) {}

  async track(
    type: EventType,
    name: string,
    properties: EventProperties = {},
    context: Partial<EventContext> = {},
    userId?: string | null | undefined,
  ): Promise<void> {
    // Create base event
    const event = TrackingEvent.create(type, name, properties, context);

    // Check consent
    const consent = await this.consentManager.checkConsent(userId);

    // Handle based on consent level
    if (!consent.hasAnalytics) {
      // Only track anonymous, necessary events
      if (type === 'page_view' || type === 'consent_change') {
        const anonymized = event.anonymize();
        await this.eventStore.store(anonymized);
      }
      return;
    }

    // Full tracking with consent
    let enrichedEvent = await this.enricher.enrich(event);
    
    if (userId) {
      enrichedEvent = enrichedEvent.withUser(userId as any);
    }

    // Store and publish
    await this.eventStore.store(enrichedEvent);
    await this.eventStore.publish(enrichedEvent);
  }

  async trackPageView(
    url: string,
    referrer?: string,
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'page_view',
      'Page View',
      { url, referrer },
      { url, referrer },
      userId,
    );
  }

  async trackSnackStart(
    snackId: string,
    version: string,
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'snack_start',
      `Snack Started: ${snackId}`,
      { snackId, version },
      { snackId, snackVersion: version },
      userId,
    );
  }

  async trackSnackComplete(
    snackId: string,
    duration: number,
    xpEarned: number,
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'snack_complete',
      `Snack Completed: ${snackId}`,
      { snackId, duration, xpEarned },
      { snackId },
      userId,
    );
  }

  async trackClick(
    target: string,
    position: { x: number; y: number },
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'click',
      'Click',
      { target, x: position.x, y: position.y },
      {},
      userId,
    );
  }

  async trackScroll(
    depth: number,
    velocity: number,
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'scroll',
      'Scroll',
      { depth, velocity },
      {},
      userId,
    );
  }

  async trackShare(
    snackId: string,
    platform: string,
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'share',
      `Shared: ${snackId}`,
      { snackId, platform },
      { snackId },
      userId,
    );
  }

  async trackConsentChange(
    categories: ConsentCategory[],
    granted: boolean,
    userId?: string | null,
  ): Promise<void> {
    await this.track(
      'consent_change',
      'Consent Changed',
      { categories, granted },
      {},
      userId,
    );
  }

  async getSessionEvents(sessionId: string): Promise<TrackingEvent[]> {
    return this.eventStore.getEvents(sessionId);
  }
}
