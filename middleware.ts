/**
 * Next.js 14 인증 미들웨어.
 *   - 보호 라우트(/post/create, /my, /profile/me): 비로그인 → /login 리다이렉트
 *   - 공개 라우트: /, /post/[id], /login, /register, /auth/callback
 *   - 모든 요청에서 updateSession 호출 → Supabase 토큰 갱신
 *
 *   Next.js 16 마이그레이션 시 이 파일을 그대로 proxy.ts 로 옮기고
 *   export 함수명을 middleware → proxy 로 변경하면 된다.
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/post/create", "/my"];
// forgot-password, reset-password는 미인증 상태에서 접근 가능한 공개 경로
const DEV_ONLY_PREFIXES = ["/test", "/api/test"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 프로덕션에서 테스트 라우트 차단
  if (
    process.env.NODE_ENV === "production" &&
    DEV_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { response, user } = await updateSession(request);
  const { search } = request.nextUrl;

  if (isProtected(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname + (search || ""));
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  /**
   * _next, 정적 자원, 이미지, 파비콘, PWA 매니페스트, 서비스워커는 제외.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/|images/|\\.well-known/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
