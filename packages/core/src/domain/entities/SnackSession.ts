import { z } from 'zod';
import { UserId, PersonalityType } from './User';

// Snack Types
export const SnackType = z.enum([
  'privacy-leak-detector',
  'click-dna-analyzer',
  'scroll-behavior-decoder',
  'typing-rhythm-analyzer',
  'color-psychology-test',
  'attention-span-meter',
  'decision-tree-explorer',
  'pattern-pizza',
  'bias-burger',
  'correlation-nuggets',
]);
export type SnackType = z.infer<typeof SnackType>;

// Snack Data
export const SnackData = z.record(z.unknown());
export type SnackData = z.infer<typeof SnackData>;

// Analysis Result
export const AnalysisResult = z.object({
  personalityType: PersonalityType.optional(),
  scores: z.record(z.number()),
  insights: z.array(z.string()),
  comparisons: z.array(z.object({
    label: z.string(),
    value: z.number(),
    percentile: z.number(),
  })),
  marketValue: z.number().optional(),
  recommendations: z.array(z.string()).optional(),
});
export type AnalysisResult = z.infer<typeof AnalysisResult>;

// Snack Session Entity
export class SnackSession {
  constructor(
    public readonly id: string,
    public readonly userId: UserId | null,
    public readonly snackType: SnackType,
    public readonly version: string,
    public readonly startedAt: Date,
    public readonly completedAt: Date | null,
    public readonly dataCollected: SnackData,
    public readonly analysis: AnalysisResult | null,
    public readonly xpEarned: number,
    public readonly achievementsUnlocked: string[],
    public readonly shareToken: string | null,
    public readonly sharedAt: Date | null,
    public readonly shareCount: number,
  ) {}

  static start(
    snackType: SnackType,
    version: string = '1.0.0',
    userId: UserId | null = null,
  ): SnackSession {
    return new SnackSession(
      crypto.randomUUID(),
      userId,
      snackType,
      version,
      new Date(),
      null,
      {},
      null,
      0,
      [],
      null,
      null,
      0,
    );
  }

  recordData(data: SnackData): SnackSession {
    return new SnackSession(
      this.id,
      this.userId,
      this.snackType,
      this.version,
      this.startedAt,
      this.completedAt,
      { ...this.dataCollected, ...data },
      this.analysis,
      this.xpEarned,
      this.achievementsUnlocked,
      this.shareToken,
      this.sharedAt,
      this.shareCount,
    );
  }

  complete(analysis: AnalysisResult, xpEarned: number = 0): SnackSession {
    return new SnackSession(
      this.id,
      this.userId,
      this.snackType,
      this.version,
      this.startedAt,
      new Date(),
      this.dataCollected,
      analysis,
      xpEarned,
      this.achievementsUnlocked,
      this.shareToken,
      this.sharedAt,
      this.shareCount,
    );
  }

  unlockAchievement(achievementId: string): SnackSession {
    if (this.achievementsUnlocked.includes(achievementId)) {
      return this;
    }

    return new SnackSession(
      this.id,
      this.userId,
      this.snackType,
      this.version,
      this.startedAt,
      this.completedAt,
      this.dataCollected,
      this.analysis,
      this.xpEarned,
      [...this.achievementsUnlocked, achievementId],
      this.shareToken,
      this.sharedAt,
      this.shareCount,
    );
  }

  generateShareToken(): SnackSession {
    const token = Buffer.from(this.id).toString('base64url').substring(0, 8);
    
    return new SnackSession(
      this.id,
      this.userId,
      this.snackType,
      this.version,
      this.startedAt,
      this.completedAt,
      this.dataCollected,
      this.analysis,
      this.xpEarned,
      this.achievementsUnlocked,
      token,
      new Date(),
      this.shareCount,
    );
  }

  incrementShareCount(): SnackSession {
    return new SnackSession(
      this.id,
      this.userId,
      this.snackType,
      this.version,
      this.startedAt,
      this.completedAt,
      this.dataCollected,
      this.analysis,
      this.xpEarned,
      this.achievementsUnlocked,
      this.shareToken,
      this.sharedAt,
      this.shareCount + 1,
    );
  }

  get duration(): number | null {
    if (!this.completedAt) return null;
    return this.completedAt.getTime() - this.startedAt.getTime();
  }

  get isCompleted(): boolean {
    return this.completedAt !== null && this.analysis !== null;
  }

  get isShared(): boolean {
    return this.shareToken !== null;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      snackType: this.snackType,
      version: this.version,
      startedAt: this.startedAt.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      dataCollected: this.dataCollected,
      analysis: this.analysis,
      xpEarned: this.xpEarned,
      achievementsUnlocked: this.achievementsUnlocked,
      shareToken: this.shareToken,
      sharedAt: this.sharedAt?.toISOString(),
      shareCount: this.shareCount,
      duration: this.duration,
    };
  }
}
