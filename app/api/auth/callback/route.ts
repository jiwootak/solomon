/**
 * OAuth 콜백 라우트.
 * Google OAuth 또는 이메일 매직 링크가 ?code=... 로 리다이렉트되면
 * 코드를 세션으로 교환한 뒤 ?redirect (default: /) 로 보낸다.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  // 절대 경로(외부) 리다이렉트 차단 — 항상 같은 origin 으로 보낸다.
  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  if (!code) {
    // 코드가 없으면 로그인 페이지로 (실패 표시)
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchange error", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${origin}${safeRedirect}`);
  } catch (e) {
    console.error("[auth/callback] unexpected error", e);
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }
}
