export const dynamic = "force-dynamic";
/**
 * POST /api/posts/[id]/close
 *
 * 게시글을 수동으로 종료(=결과 공개)한다.
 *
 * 검증
 *   1. 인증 필요 → 401
 *   2. 작성자 본인만 종료 가능 → 403
 *   3. expires_at < now() 이어야 종료 가능 (24시간 경과 후) → 400
 *   4. 이미 closed 인 경우 idempotent 200 응답.
 *
 * 동작
 *   - posts.status = 'closed' UPDATE → schema.sql 의 `on_post_closed` 트리거가
 *     자동으로 솔로몬 지수(total_votes / majority_matched_votes) 갱신.
 *
 * 자동 종료
 *   - 24h 도달한 게시글은 `public.close_expired_posts()` RPC 가 일괄 처리.
 *   - 운영 옵션:
 *       (a) Supabase pg_cron:
 *           SELECT cron.schedule('close-expired', '* * * * *',
 *             $$SELECT public.close_expired_posts();$$);
 *       (b) Vercel Cron:
 *           vercel.json 의 crons 에 1분 간격으로
 *           `/api/cron/close-expired` 라우트(별도 추가) 호출.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "post id 가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  // ---------------------------------------------------------------- 1) 인증
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  // ---------------------------------------------------------------- 2) post 조회
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, status, expires_at")
    .eq("id", id)
    .maybeSingle();

  if (postError) {
    return NextResponse.json(
      { error: "게시글 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
  if (!post) {
    return NextResponse.json(
      { error: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  // ---------------------------------------------------------------- 3) 작성자 검증
  if (post.user_id !== user.id) {
    return NextResponse.json(
      { error: "본인의 게시글만 종료할 수 있습니다." },
      { status: 403 },
    );
  }

  // 이미 닫힌 경우 idempotent 처리
  if (post.status === "closed") {
    return NextResponse.json(
      { success: true, already_closed: true },
      { status: 200 },
    );
  }

  // ---------------------------------------------------------------- 4) 만료 시각 검증
  const expiresAtMs = new Date(post.expires_at).getTime();
  if (expiresAtMs > Date.now()) {
    return NextResponse.json(
      { error: "아직 종료할 수 없습니다. (24시간 경과 필요)" },
      { status: 400 },
    );
  }

  // ---------------------------------------------------------------- 5) UPDATE → 트리거 발동
  const { error: updateError } = await supabase
    .from("posts")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("user_id", user.id) // RLS 보강
    .eq("status", "active"); // 동시성: 이미 닫힌 경우 no-op

  if (updateError) {
    return NextResponse.json(
      { error: "게시글 종료 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
