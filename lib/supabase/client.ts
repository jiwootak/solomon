/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * "use client" 컴포넌트에서만 호출.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/solomon";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[supabase/client] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
