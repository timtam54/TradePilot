import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

export async function query<T>(
  tableName: string,
  options?: {
    select?: string;
    eq?: Record<string, unknown>;
    ilike?: Record<string, string>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  const db = getSupabase();
  let q = db.from(tableName).select(options?.select || '*');

  if (options?.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      q = q.eq(key, value);
    });
  }

  if (options?.ilike) {
    Object.entries(options.ilike).forEach(([key, value]) => {
      q = q.ilike(key, `%${value}%`);
    });
  }

  if (options?.order) {
    q = q.order(options.order.column, { ascending: options.order.ascending ?? false });
  }

  if (options?.limit) {
    q = q.limit(options.limit);
  }

  const { data, error } = await q;

  if (error) {
    console.error('Query error:', error);
    throw error;
  }

  return (data || []) as T[];
}

export async function queryOne<T>(
  tableName: string,
  options?: {
    select?: string;
    eq?: Record<string, unknown>;
  }
): Promise<T | null> {
  const db = getSupabase();
  let q = db.from(tableName).select(options?.select || '*');

  if (options?.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      q = q.eq(key, value);
    });
  }

  const { data, error } = await q.limit(1).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Query error:', error);
    throw error;
  }

  return data as T | null;
}

export async function insert<T>(
  tableName: string,
  data: Record<string, unknown>
): Promise<T> {
  const db = getSupabase();
  const { data: result, error } = await db
    .from(tableName)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    throw error;
  }

  return result as T;
}

export async function update<T>(
  tableName: string,
  data: Record<string, unknown>,
  eq: Record<string, unknown>
): Promise<T> {
  const db = getSupabase();
  let q = db.from(tableName).update(data);

  Object.entries(eq).forEach(([key, value]) => {
    q = q.eq(key, value);
  });

  const { data: result, error } = await q.select().single();

  if (error) {
    console.error('Update error:', error);
    throw error;
  }

  return result as T;
}

export async function remove(
  tableName: string,
  eq: Record<string, unknown>
): Promise<void> {
  const db = getSupabase();
  let q = db.from(tableName).delete();

  Object.entries(eq).forEach(([key, value]) => {
    q = q.eq(key, value);
  });

  const { error } = await q;

  if (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

// For raw SQL queries using Supabase's rpc or direct postgres
export async function rawQuery<T>(
  sql: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const db = getSupabase();
  const { data, error } = await db.rpc('exec_sql', { query: sql, params });

  if (error) {
    console.error('Raw query error:', error);
    throw error;
  }

  return (data || []) as T[];
}

export { getSupabase as getConnection };
