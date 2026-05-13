export const dynamic = "force-dynamic";

/**
 * POST /api/reports
 * 게시글 신고. 게시글당 1인 1회 제한 (DB UNIQUE 제약).
 *
 * body: { post_id: string, reason: string }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const VALID_REASONS = [
  "욕설/혐오 표현",
  "개인정보 노출",
  "허위 정보/스팸",
  "음란/성적 콘텐츠",
  "기타",
] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { post_id?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const post_id = typeof body.post_id === "string" ? body.post_id : "";
  const reason  = typeof body.reason  === "string" ? body.reason.trim() : "";

  if (!UUID_RE.test(post_id)) {
    return NextResponse.json({ error: "게시글 id가 올바르지 않습니다." }, { status: 400 });
  }
  if (!VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    return NextResponse.json({ error: "신고 사유를 선택해 주세요." }, { status: 400 });
  }

  // 본인 게시글 신고 차단
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", post_id)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.user_id === user.id) {
    return NextResponse.json({ error: "본인 게시글은 신고할 수 없습니다." }, { status: 400 });
  }

  const { error } = await supabase
    .from("reports")
    .insert({ post_id, reporter_id: user.id, reason });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 신고한 게시글입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "신고 처리 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
