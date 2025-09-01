import { z } from 'zod';

// Value Objects
export const UserId = z.string().uuid().brand('UserId');
export type UserId = z.infer<typeof UserId>;

export const Fingerprint = z.string().min(32).brand('Fingerprint');
export type Fingerprint = z.infer<typeof Fingerprint>;

// Consent State
export const ConsentCategory = z.enum(['necessary', 'analytics', 'marketing', 'personalization']);
export type ConsentCategory = z.infer<typeof ConsentCategory>;

export const ConsentState = z.object({
  version: z.number().min(1),
  categories: z.record(ConsentCategory, z.boolean()),
  grantedAt: z.date().optional(),
  ipAddress: z.string().optional(),
});
export type ConsentState = z.infer<typeof ConsentState>;

// User Profile
export const PersonalityType = z.enum([
  'rapid-clicker',
  'decisive-actor', 
  'cautious-explorer',
  'pattern-seeker',
  'efficiency-optimizer',
  'chaos-navigator',
]);
export type PersonalityType = z.infer<typeof PersonalityType>;

export const UserProfile = z.object({
  personalityType: PersonalityType.optional(),
  totalXp: z.number().min(0).default(0),
  level: z.number().min(1).default(1),
  achievements: z.array(z.string()).default([]),
  marketValue: z.number().min(0).optional(),
});
export type UserProfile = z.infer<typeof UserProfile>;

// User Entity
export class User {
  constructor(
    public readonly id: UserId,
    public readonly fingerprint: Fingerprint,
    public readonly consent: ConsentState,
    public readonly profile: UserProfile,
    public readonly createdAt: Date,
    public readonly lastSeenAt: Date,
    public readonly deletionRequestedAt?: Date,
  ) {}

  static createAnonymous(fingerprint: string): User {
    return new User(
      crypto.randomUUID() as UserId,
      fingerprint as Fingerprint,
      {
        version: 1,
        categories: {
          necessary: true,
          analytics: false,
          marketing: false,
          personalization: false,
        },
      },
      {
        totalXp: 0,
        level: 1,
        achievements: [],
      },
      new Date(),
      new Date(),
    );
  }

  grantConsent(categories: ConsentCategory[]): User {
    const newCategories = { ...this.consent.categories };
    categories.forEach(cat => {
      newCategories[cat] = true;
    });

    return new User(
      this.id,
      this.fingerprint,
      {
        ...this.consent,
        categories: newCategories,
        grantedAt: new Date(),
      },
      this.profile,
      this.createdAt,
      new Date(),
      this.deletionRequestedAt,
    );
  }

  revokeConsent(categories: ConsentCategory[]): User {
    const newCategories = { ...this.consent.categories };
    categories.forEach(cat => {
      if (cat !== 'necessary') {
        newCategories[cat] = false;
      }
    });

    return new User(
      this.id,
      this.fingerprint,
      {
        ...this.consent,
        categories: newCategories,
      },
      this.profile,
      this.createdAt,
      new Date(),
      this.deletionRequestedAt,
    );
  }

  addXp(amount: number): User {
    const newXp = this.profile.totalXp + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;

    return new User(
      this.id,
      this.fingerprint,
      this.consent,
      {
        ...this.profile,
        totalXp: newXp,
        level: newLevel,
      },
      this.createdAt,
      new Date(),
      this.deletionRequestedAt,
    );
  }

  unlockAchievement(achievementId: string): User {
    if (this.profile.achievements.includes(achievementId)) {
      return this;
    }

    return new User(
      this.id,
      this.fingerprint,
      this.consent,
      {
        ...this.profile,
        achievements: [...this.profile.achievements, achievementId],
      },
      this.createdAt,
      new Date(),
      this.deletionRequestedAt,
    );
  }

  requestDeletion(): User {
    return new User(
      this.id,
      this.fingerprint,
      this.consent,
      this.profile,
      this.createdAt,
      new Date(),
      new Date(),
    );
  }

  get hasFullConsent(): boolean {
    return Object.values(this.consent.categories).every(v => v === true);
  }

  get hasAnalyticsConsent(): boolean {
    return this.consent.categories.analytics === true;
  }

  get isDeleted(): boolean {
    return this.deletionRequestedAt !== undefined;
  }
}
