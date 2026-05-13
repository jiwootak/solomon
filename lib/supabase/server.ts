/**
 * 서버 컴포넌트 / 라우트 핸들러 / Server Action 용 Supabase 클라이언트.
 * 쿠키 기반 세션 — Next.js 14 App Router 의 cookies() 를 사용.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/solomon";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[supabase/server] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.",
    );
  }

  // Next.js 14: cookies() 는 동기 / 15+ 는 비동기. await 으로 통일.
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch {
          // 서버 컴포넌트 컨텍스트에서는 set 불가 — proxy/middleware 가 갱신을 담당.
        }
      },
    },
  });
}
