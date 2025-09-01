import { SnackSession, SnackType, AnalysisResult } from '../../domain/entities/SnackSession';
import { PersonalityType } from '../../domain/entities/User';

export interface BehaviorPattern {
  clicks: Array<{ x: number; y: number; time: number }>;
  scrolls: Array<{ depth: number; velocity: number; time: number }>;
  hovers: Array<{ target: string; duration: number }>;
  keystrokes?: Array<{ key: string; timing: number }>;
}

export interface PersonalityAnalysis {
  type: PersonalityType;
  confidence: number;
  traits: Record<string, number>;
  marketValue: number;
}

export class AnalyticsService {
  analyzeClickPattern(clickData: BehaviorPattern['clicks']): PersonalityAnalysis {
    const clicks = clickData; // Avoid unused variable
    if (clicks.length === 0) {
      return {
        type: 'cautious-explorer',
        confidence: 0,
        traits: {},
        marketValue: 0,
      };
    }

    // Calculate metrics
    const avgSpeed = this.calculateAverageSpeed(clicks);
    const accuracy = this.calculateAccuracy(clicks);
    const hesitation = this.calculateHesitation(clicks);
    const patterns = this.detectPatterns(clicks);

    // Determine personality type
    let type: PersonalityType;
    let confidence = 0;

    if (avgSpeed < 300 && accuracy > 0.9) {
      type = 'rapid-clicker';
      confidence = 0.85;
    } else if (avgSpeed < 500 && accuracy > 0.8) {
      type = 'decisive-actor';
      confidence = 0.75;
    } else if (hesitation > 0.3) {
      type = 'cautious-explorer';
      confidence = 0.8;
    } else if (patterns.repetitive > 0.5) {
      type = 'pattern-seeker';
      confidence = 0.7;
    } else if (patterns.efficient > 0.6) {
      type = 'efficiency-optimizer';
      confidence = 0.75;
    } else {
      type = 'chaos-navigator';
      confidence = 0.6;
    }

    // Calculate market value based on uniqueness
    const uniqueness = this.calculateUniqueness({ avgSpeed, accuracy, hesitation, patterns });
    const marketValue = Math.round(uniqueness * 15000);

    return {
      type,
      confidence,
      traits: {
        speed: avgSpeed,
        accuracy,
        hesitation,
        repetitiveness: patterns.repetitive,
        efficiency: patterns.efficient,
      },
      marketValue,
    };
  }

  analyzePrivacyLeaks(leaks: Array<{ type: string; uniqueness: number }>): AnalysisResult {
    const overallUniqueness = leaks.reduce((sum, leak) => sum + leak.uniqueness, 0) / leaks.length;
    const marketValue = Math.round(overallUniqueness * 20000);

    const insights = [];
    
    if (overallUniqueness > 0.9) {
      insights.push('Your browser fingerprint is highly unique - you\'re easily trackable');
    } else if (overallUniqueness > 0.7) {
      insights.push('Your browser has distinctive features that make you moderately trackable');
    } else {
      insights.push('Your browser fingerprint is relatively common - harder to track uniquely');
    }

    if (leaks.find(l => l.type === 'canvas_fingerprint')) {
      insights.push('Canvas fingerprinting can track you across websites without cookies');
    }

    if (leaks.find(l => l.type === 'webgl_gpu')) {
      insights.push('Your graphics card reveals your device type and can persist across browsers');
    }

    return {
      scores: {
        privacy: (1 - overallUniqueness) * 100,
        uniqueness: overallUniqueness * 100,
        trackability: overallUniqueness * 100,
      },
      insights,
      comparisons: [
        {
          label: 'Privacy Score',
          value: (1 - overallUniqueness) * 100,
          percentile: Math.round((1 - overallUniqueness) * 100),
        },
        {
          label: 'Browser Uniqueness',
          value: overallUniqueness * 100,
          percentile: Math.round(overallUniqueness * 100),
        },
      ],
      marketValue,
      recommendations: [
        'Use privacy-focused browsers like Firefox or Brave',
        'Enable tracking protection and fingerprint resistance',
        'Use VPN or Tor for enhanced privacy',
        'Regularly clear cookies and browser data',
      ],
    };
  }

  private calculateAverageSpeed(clicks: BehaviorPattern['clicks']): number {
    if (clicks.length < 2) return 0;

    const speeds = [];
    for (let i = 1; i < clicks.length; i++) {
      const current = clicks[i];
      const prev = clicks[i - 1];
      if (current && prev) {
        speeds.push(current.time - prev.time);
      }
    }

    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
  }

  private calculateAccuracy(_clicks: BehaviorPattern['clicks']): number {
    // Simplified accuracy calculation
    // In real implementation, would check against actual targets
    return 0.85 + Math.random() * 0.15;
  }

  private calculateHesitation(clicks: BehaviorPattern['clicks']): number {
    if (clicks.length < 2) return 0;

    const delays = [];
    for (let i = 1; i < clicks.length; i++) {
      const current = clicks[i];
      const prev = clicks[i - 1];
      if (current && prev) {
        const delay = current.time - prev.time;
        if (delay > 1000) {
          delays.push(delay);
        }
      }
    }

    return delays.length / clicks.length;
  }

  private detectPatterns(_clicks: BehaviorPattern['clicks']): { repetitive: number; efficient: number } {
    // Simplified pattern detection
    return {
      repetitive: 0.3 + Math.random() * 0.4,
      efficient: 0.4 + Math.random() * 0.4,
    };
  }

  private calculateUniqueness(traits: Record<string, any>): number {
    // Simplified uniqueness calculation
    const factors = Object.values(traits).map(v => {
      if (typeof v === 'number') {
        return v;
      } else if (typeof v === 'object' && v !== null) {
        const values = Object.values(v);
        return values.reduce((a, b) => (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0), 0) as number;
      }
      return 0;
    });
    
    const avg = factors.reduce((a, b) => a + Number(b), 0) / factors.length;
    return Math.min(0.95, Math.max(0.4, avg / 1000));
  }

  calculateXP(snackType: SnackType, duration: number, accuracy: number): number {
    const baseXP = {
      'privacy-leak-detector': 250,
      'click-dna-analyzer': 300,
      'scroll-behavior-decoder': 200,
      'typing-rhythm-analyzer': 350,
      'color-psychology-test': 150,
      'attention-span-meter': 400,
      'decision-tree-explorer': 300,
      'pattern-pizza': 500,
      'bias-burger': 450,
      'correlation-nuggets': 350,
    };

    const base = baseXP[snackType] || 100;
    const speedBonus = duration < 30000 ? 50 : 0;
    const accuracyBonus = Math.round(accuracy * 100);

    return base + speedBonus + accuracyBonus;
  }

  checkAchievements(session: SnackSession): string[] {
    const achievements: string[] = [];

    // Speed achievements
    if (session.duration && session.duration < 20000) {
      achievements.push('speed-demon');
    }

    // Completion achievements
    if (session.isCompleted) {
      achievements.push(`${session.snackType}-master`);
    }

    // XP achievements
    if (session.xpEarned > 500) {
      achievements.push('xp-champion');
    }

    // Sharing achievements
    if (session.shareCount > 5) {
      achievements.push('viral-sensation');
    }

    return achievements;
  }
}
