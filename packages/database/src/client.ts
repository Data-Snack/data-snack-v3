import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Database,
  DatabaseUser,
  DatabaseEvent,
  DatabaseSnackSession,
  DatabaseAchievement,
  DatabaseUserAchievement,
  InsertUser,
  InsertEvent,
  InsertSnackSession,
  UpdateUser,
  UpdateSnackSession
} from './types';

export type SupabaseDatabase = Database;
export type DatabaseClient = SupabaseClient<Database>;

// Create Supabase client with proper typing
export function createDatabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
  }
): DatabaseClient {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'data-snack-v3',
      },
    },
  });
}

// Environment-based client (for server-side use)
export function createServerDatabaseClient(): DatabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase environment variables not found. Database features disabled.');
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Client-side client
export function createClientDatabaseClient(): DatabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createDatabaseClient(supabaseUrl, supabaseAnonKey);
}

// Repository pattern interfaces
export interface UserRepository {
  findByFingerprint(fingerprint: string): Promise<DatabaseUser | null>;
  create(user: InsertUser): Promise<DatabaseUser>;
  update(id: string, updates: UpdateUser): Promise<DatabaseUser>;
  delete(id: string): Promise<void>;
  anonymize(id: string): Promise<void>;
}

export interface EventRepository {
  create(event: InsertEvent): Promise<DatabaseEvent>;
  findByUser(userId: string, limit?: number): Promise<DatabaseEvent[]>;
  findBySession(sessionId: string): Promise<DatabaseEvent[]>;
  anonymize(userId: string): Promise<void>;
}

export interface SnackSessionRepository {
  create(session: InsertSnackSession): Promise<DatabaseSnackSession>;
  findById(id: string): Promise<DatabaseSnackSession | null>;
  findByUser(userId: string): Promise<DatabaseSnackSession[]>;
  findByShareToken(token: string): Promise<DatabaseSnackSession | null>;
  update(id: string, updates: UpdateSnackSession): Promise<DatabaseSnackSession>;
  complete(id: string, results: any): Promise<DatabaseSnackSession>;
}

export interface AchievementRepository {
  findAll(): Promise<DatabaseAchievement[]>;
  findById(id: string): Promise<DatabaseAchievement | null>;
  findByUser(userId: string): Promise<DatabaseUserAchievement[]>;
  unlock(userId: string, achievementId: string, context?: any): Promise<DatabaseUserAchievement>;
}
