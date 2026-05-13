export const dynamic = "force-dynamic";

/**
 * GET /api/cron/close-expired
 *
 * Vercel Cron Job 전용 — 만료된 게시글을 일괄 종료한다.
 *
 * 인증
 *   Vercel 은 cron 요청 시 Authorization: Bearer <CRON_SECRET> 헤더를 자동으로 포함.
 *   CRON_SECRET 환경변수가 설정되어 있으면 반드시 일치해야 한다.
 *
 * 필요 환경변수
 *   SUPABASE_SERVICE_ROLE_KEY — close_expired_posts() 는 service_role 전용 RPC
 *   CRON_SECRET               — Vercel Cron 인증 시크릿
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/solomon";

export async function GET(request: Request) {
  // ── 인증 ─────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── Supabase service role 클라이언트 ──────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[cron] SUPABASE_SERVICE_ROLE_KEY not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ── 만료 게시글 일괄 종료 ─────────────────────────────────────────────────
  const { data, error } = await supabase.rpc("close_expired_posts");

  if (error) {
    console.error("[cron] close_expired_posts RPC failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const closed = data as number;
  console.log(`[cron] closed ${closed} expired post(s) at ${new Date().toISOString()}`);

  return NextResponse.json({
    ok: true,
    closed,
    timestamp: new Date().toISOString(),
  });
}
