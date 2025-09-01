// Database types and schemas
export * from './types';

// Supabase client and utilities
export * from './client';

// Re-export commonly used types
export type {
  DatabaseUser,
  DatabaseEvent,
  DatabaseSnackSession,
  DatabaseAchievement,
  DatabaseUserAchievement,
  InsertUser,
  InsertEvent,
  InsertSnackSession,
  UpdateUser,
  UpdateEvent,
  UpdateSnackSession,
} from './types';

export type {
  DatabaseClient,
  UserRepository,
  EventRepository,
  SnackSessionRepository,
  AchievementRepository,
} from './client';
