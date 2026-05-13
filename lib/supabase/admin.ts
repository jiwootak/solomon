import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/solomon";

/**
 * Supabase service role 클라이언트 — RLS 우회.
 * 서버 사이드 전용. 절대 클라이언트 번들에 포함하지 말 것.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("[supabase/admin] SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
