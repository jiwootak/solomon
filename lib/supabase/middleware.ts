/**
 * Next.js 미들웨어용 세션 갱신 유틸.
 * 루트 middleware.ts 에서 호출되어 토큰을 회전시키고 쿠키를 응답에 반영한다.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/solomon";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // env 누락 시 미들웨어를 통과만 시키고 라우팅에 영향 주지 않음.
  if (!url || !anonKey) return { response, user: null };

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as CookieOptions),
        );
      },
    },
  });

  // ★ 반드시 호출 — 토큰 회전 트리거.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
