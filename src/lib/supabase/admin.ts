import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnvironment } from "./env";

export type SupabaseAdminClient = SupabaseClient;

export function createSupabaseAdminClient(): SupabaseAdminClient {
  const { url, adminKey } = getSupabaseAdminEnvironment();

  return createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
