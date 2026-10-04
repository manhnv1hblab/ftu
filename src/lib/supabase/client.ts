'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabasePublishableKey, supabaseUrl } from './config';

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) return null;
  if (!client) client = createBrowserClient(supabaseUrl, supabasePublishableKey);
  return client;
}
