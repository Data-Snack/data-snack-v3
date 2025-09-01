import { z } from 'zod';

// Database Table Types
export const DatabaseUser = z.object({
  id: z.string().uuid(),
  fingerprint_hash: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_seen_at: z.string().datetime(),
  
  // Consent
  consent_version: z.number(),
  consent_categories: z.object({
    necessary: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    personalization: z.boolean(),
  }),
  consent_granted_at: z.string().datetime().nullable(),
  consent_ip_address: z.string().nullable(),
  
  // GDPR
  data_retention_days: z.number().default(90),
  deletion_requested_at: z.string().datetime().nullable(),
  anonymized_at: z.string().datetime().nullable(),
  data_export_requested_at: z.string().datetime().nullable(),
  last_export_at: z.string().datetime().nullable(),
  
  // Profile
  personality_type: z.string().nullable(),
  total_xp: z.number().default(0),
  level: z.number().default(1),
  achievements: z.array(z.string()).default([]),
  market_value: z.number().nullable(),
});

export const DatabaseEvent = z.object({
  time: z.string().datetime(),
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  session_id: z.string().uuid(),
  
  // Event data
  event_type: z.string(),
  event_name: z.string(),
  properties: z.record(z.unknown()).default({}),
  context: z.record(z.unknown()).default({}),
  
  // Metadata
  server_timestamp: z.string().datetime(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  
  // Privacy
  is_anonymous: z.boolean().default(false),
  consent_state: z.record(z.boolean()).nullable(),
});

export const DatabaseSnackSession = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  snack_id: z.string(),
  snack_version: z.string().default('1.0.0'),
  
  // Timing
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  abandoned_at: z.string().datetime().nullable(),
  duration_ms: z.number().nullable(),
  
  // Data
  raw_data: z.record(z.unknown()).default({}),
  processed_data: z.record(z.unknown()).default({}),
  
  // Analysis
  personality_analysis: z.record(z.unknown()).nullable(),
  personality_type: z.string().nullable(),
  market_value: z.number().nullable(),
  uniqueness_score: z.number().nullable(),
  confidence_score: z.number().nullable(),
  
  // Gamification
  xp_awarded: z.number().default(0),
  achievements_unlocked: z.array(z.string()).default([]),
  
  // Sharing
  share_token: z.string().nullable(),
  shared_at: z.string().datetime().nullable(),
  share_count: z.number().default(0),
  is_public: z.boolean().default(false),
});

export const DatabaseAchievement = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  xp_reward: z.number().default(0),
  icon: z.string().nullable(),
  requirements: z.record(z.unknown()).default({}),
  is_secret: z.boolean().default(false),
  created_at: z.string().datetime(),
});

export const DatabaseUserAchievement = z.object({
  user_id: z.string().uuid(),
  achievement_id: z.string(),
  unlocked_at: z.string().datetime(),
  context: z.record(z.unknown()).default({}),
});

// Type exports
export type DatabaseUser = z.infer<typeof DatabaseUser>;
export type DatabaseEvent = z.infer<typeof DatabaseEvent>;
export type DatabaseSnackSession = z.infer<typeof DatabaseSnackSession>;
export type DatabaseAchievement = z.infer<typeof DatabaseAchievement>;
export type DatabaseUserAchievement = z.infer<typeof DatabaseUserAchievement>;

// Supabase Database Type Interface
export interface Database {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser;
        Insert: InsertUser;
        Update: UpdateUser;
      };
      events: {
        Row: DatabaseEvent;
        Insert: InsertEvent;
        Update: Partial<InsertEvent>;
      };
      snack_sessions: {
        Row: DatabaseSnackSession;
        Insert: InsertSnackSession;
        Update: UpdateSnackSession;
      };
      achievements: {
        Row: DatabaseAchievement;
        Insert: InsertAchievement;
        Update: Partial<InsertAchievement>;
      };
      user_achievements: {
        Row: DatabaseUserAchievement;
        Insert: InsertUserAchievement;
        Update: Partial<InsertUserAchievement>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Insert types (without auto-generated fields)
export type InsertUser = Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at' | 'last_seen_at'>;
export type InsertEvent = Omit<DatabaseEvent, 'id' | 'time' | 'server_timestamp'>;
export type InsertSnackSession = Omit<DatabaseSnackSession, 'id' | 'started_at'>;
export type InsertAchievement = Omit<DatabaseAchievement, 'created_at'>;
export type InsertUserAchievement = Omit<DatabaseUserAchievement, 'unlocked_at'>;

// Update types (partial)
export type UpdateUser = Partial<Omit<DatabaseUser, 'id' | 'created_at'>>;
export type UpdateEvent = Partial<Omit<DatabaseEvent, 'id' | 'time'>>;
export type UpdateSnackSession = Partial<Omit<DatabaseSnackSession, 'id' | 'user_id' | 'started_at'>>;
