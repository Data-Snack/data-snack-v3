import { z } from 'zod';
import { UserId } from './User';

// Event Types
export const EventType = z.enum([
  'page_view',
  'snack_start',
  'snack_complete',
  'snack_abandon',
  'click',
  'scroll',
  'hover',
  'form_submit',
  'share',
  'consent_change',
  'achievement_unlock',
  'data_export',
  'data_deletion',
]);
export type EventType = z.infer<typeof EventType>;

// Event Context
export const EventContext = z.object({
  url: z.string().url().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  screenResolution: z.string().optional(),
  viewport: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  platform: z.string().optional(),
  
  // Custom context
  snackId: z.string().optional(),
  snackVersion: z.string().optional(),
  experimentId: z.string().optional(),
  experimentVariant: z.string().optional(),
});
export type EventContext = z.infer<typeof EventContext>;

// Event Properties
export const EventProperties = z.record(z.unknown());
export type EventProperties = z.infer<typeof EventProperties>;

// Tracking Event Entity
export class TrackingEvent {
  constructor(
    public readonly id: string,
    public readonly userId: UserId | null,
    public readonly sessionId: string,
    public readonly type: EventType,
    public readonly name: string,
    public readonly properties: EventProperties,
    public readonly context: EventContext,
    public readonly timestamp: Date,
    public readonly serverTimestamp?: Date,
  ) {}

  static create(
    type: EventType,
    name: string,
    properties: EventProperties = {},
    context: Partial<EventContext> = {},
  ): TrackingEvent {
    const fullContext: EventContext = {
      userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
      url: context.url,
      referrer: context.referrer,
      screenResolution: context.screenResolution,
      viewport: context.viewport,
      timezone: context.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined),
      language: context.language || (typeof navigator !== 'undefined' ? navigator.language : undefined),
      platform: context.platform,
      snackId: context.snackId,
      snackVersion: context.snackVersion,
      experimentId: context.experimentId,
      experimentVariant: context.experimentVariant,
    };

    return new TrackingEvent(
      crypto.randomUUID(),
      null,
      '', // Session ID will be set by the tracking service
      type,
      name,
      properties,
      fullContext,
      new Date(),
    );
  }

  withUser(userId: UserId): TrackingEvent {
    return new TrackingEvent(
      this.id,
      userId,
      this.sessionId,
      this.type,
      this.name,
      this.properties,
      this.context,
      this.timestamp,
      this.serverTimestamp,
    );
  }

  withSession(sessionId: string): TrackingEvent {
    return new TrackingEvent(
      this.id,
      this.userId,
      sessionId,
      this.type,
      this.name,
      this.properties,
      this.context,
      this.timestamp,
      this.serverTimestamp,
    );
  }

  withServerTimestamp(): TrackingEvent {
    return new TrackingEvent(
      this.id,
      this.userId,
      this.sessionId,
      this.type,
      this.name,
      this.properties,
      this.context,
      this.timestamp,
      new Date(),
    );
  }

  anonymize(): TrackingEvent {
    // Remove user ID and sensitive properties
    const anonymizedProperties = { ...this.properties };
    delete anonymizedProperties.email;
    delete anonymizedProperties.name;
    delete anonymizedProperties.phone;

    // Anonymize context
    const anonymizedContext = { ...this.context };
    if (anonymizedContext.userAgent) {
      // Keep only browser and OS info
      anonymizedContext.userAgent = anonymizedContext.userAgent.split(' ')[0];
    }

    return new TrackingEvent(
      this.id,
      null, // Remove user ID
      this.sessionId,
      this.type,
      this.name,
      anonymizedProperties,
      anonymizedContext,
      this.timestamp,
      this.serverTimestamp,
    );
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      type: this.type,
      name: this.name,
      properties: this.properties,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      serverTimestamp: this.serverTimestamp?.toISOString(),
    };
  }
}
