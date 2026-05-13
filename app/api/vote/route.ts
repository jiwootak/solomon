export const dynamic = "force-dynamic";
/**
 * POST /api/vote
 *
 * 요청 바디: { post_id: string, option_id: string }
 *
 * 검증 순서
 *   1. 인증 확인 → 401
 *   2. 입력 유효성 (UUID 형식)
 *   3. 게시글 존재 + status='active' + expires_at > now()
 *      → 종료된 경우 400 "투표가 종료되었습니다"
 *   4. 이미 투표 여부 확인 → 400 "이미 투표하셨습니다"
 *   5. option 이 해당 post 에 속하는지 확인 → 400 "선택지가 올바르지 않습니다"
 *   6. votes INSERT (RLS 가 한 번 더 검증)
 *
 * 블라인드 룰
 *   - 응답에 vote_count / 다른 사람 투표 정보 절대 포함 금지.
 *   - 결과(집계)는 expires_at 이후 GET /api/posts/[id] 에서만 노출.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface VoteRequestBody {
  post_id?: unknown;
  option_id?: unknown;
}

export async function POST(request: Request) {
  // ---------------------------------------------------------------- body parse
  let body: VoteRequestBody;
  try {
    body = (await request.json()) as VoteRequestBody;
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON 이 아닙니다." },
      { status: 400 },
    );
  }

  const post_id = typeof body.post_id === "string" ? body.post_id : "";
  const option_id = typeof body.option_id === "string" ? body.option_id : "";

  if (!UUID_RE.test(post_id) || !UUID_RE.test(option_id)) {
    return NextResponse.json(
      { error: "post_id / option_id 가 올바르지 않습니다." },
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

  // ---------------------------------------------------------------- 2) post 존재 + 만료 검증
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, status, expires_at")
    .eq("id", post_id)
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

  const expired =
    post.status === "closed" ||
    new Date(post.expires_at).getTime() <= Date.now();
  if (expired) {
    return NextResponse.json(
      { error: "투표가 종료되었습니다." },
      { status: 400 },
    );
  }

  // ---------------------------------------------------------------- 3) option 소속 검증
  const { data: option, error: optionError } = await supabase
    .from("options")
    .select("id, post_id")
    .eq("id", option_id)
    .maybeSingle();

  if (optionError) {
    return NextResponse.json(
      { error: "선택지 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
  if (!option || option.post_id !== post_id) {
    return NextResponse.json(
      { error: "선택지가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  // ---------------------------------------------------------------- 4) 이미 투표했는지 확인
  // RLS: votes_select_self 로 본인 row 만 조회 가능.
  const { data: existing, error: existingError } = await supabase
    .from("votes")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "투표 내역 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
  if (existing) {
    return NextResponse.json(
      { error: "이미 투표하셨습니다." },
      { status: 400 },
    );
  }

  // ---------------------------------------------------------------- 5) INSERT
  const { data: inserted, error: insertError } = await supabase
    .from("votes")
    .insert({
      post_id,
      option_id,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    // UNIQUE(post_id, user_id) 위반 → 23505 (race condition)
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "이미 투표하셨습니다." },
        { status: 400 },
      );
    }
    // RLS 거절 (만료 직전 race) → 42501
    if (insertError.code === "42501") {
      return NextResponse.json(
        { error: "투표가 종료되었습니다." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "투표 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, vote_id: inserted.id },
    { status: 201 },
  );
}
