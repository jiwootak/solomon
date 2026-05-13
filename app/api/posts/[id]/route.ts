export const dynamic = "force-dynamic";
/**
 * GET /api/posts/[id]
 *
 * 게시글 상세 조회.
 *
 * 블라인드 룰
 *   - expires_at 이전 + status='active': options 에 vote_count 절대 미포함.
 *   - expires_at 이후 또는 status='closed': vote_count + solomon_choice 노출.
 *
 * 응답 형식
 *   {
 *     post: Post,
 *     options: Option[],            // 종료된 경우 vote_count 포함
 *     user_vote_option_id: string | null,
 *     solomon_choice?: string       // 종료된 경우 최다 득표 option_id
 *   }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isExpired, type Option, type Post } from "@/types/solomon";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "post id 가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // ---------------------------------------------------------------- post + options
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
        id, user_id, content, image_url, created_at, expires_at, status,
        author:users!posts_user_id_fkey ( id, nickname, avatar_url )
      `,
    )
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

  const { data: rawOptions, error: optError } = await supabase
    .from("options")
    .select("id, post_id, option_text, option_order, created_at")
    .eq("post_id", id)
    .order("option_order", { ascending: true });

  if (optError) {
    return NextResponse.json(
      { error: "선택지 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  const expired = isExpired({
    expires_at: post.expires_at,
    status: post.status,
  });

  // ---------------------------------------------------------------- 현재 유저 투표
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let user_vote_option_id: string | null = null;
  if (user) {
    const { data: myVote } = await supabase
      .from("votes")
      .select("option_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    user_vote_option_id = myVote?.option_id ?? null;
  }

  // ---------------------------------------------------------------- 블라인드 분기
  let options: Option[] = (rawOptions ?? []) as Option[];
  let solomon_choice: string | undefined;

  if (expired) {
    // ★ 결과 공개 — get_post_results RPC 가 expires_at 이중 검증.
    const { data: results, error: rpcError } = await supabase.rpc(
      "get_post_results",
      { p_post_id: id },
    );

    if (rpcError) {
      // RPC 실패 시 안전하게 vote_count 미포함으로 폴백.
      // (블라인드 룰을 위반하지 않는 방향)
      return NextResponse.json({
        post: stripPostAuthor(post),
        author: post.author ?? null,
        options,
        user_vote_option_id,
      });
    }

    const countById = new Map(
      (results ?? []).map((r) => [r.option_id, r.vote_count]),
    );
    const winner = (results ?? []).find((r) => r.is_winner);
    solomon_choice = winner?.option_id;

    options = options.map((o) => ({
      ...o,
      vote_count: Number(countById.get(o.id) ?? 0),
    }));
  }
  // expired === false 일 때는 vote_count 를 절대 추가하지 않음 (블라인드 룰)

  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return NextResponse.json({
    post: stripPostAuthor(post) as Post,
    author: author
      ? {
          id: author.id,
          nickname: author.nickname,
          avatar_url: author.avatar_url,
        }
      : null,
    options,
    user_vote_option_id,
    current_user_id: user?.id ?? null,
    ...(solomon_choice !== undefined ? { solomon_choice } : {}),
  });
}

// ============================================================================
// DELETE — 게시글 삭제 (작성자 본인만)
// ============================================================================

export async function DELETE(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "post id가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ============================================================================
// helpers
// ============================================================================

interface PostWithAuthorRow extends Post {
  author?: unknown;
}

function stripPostAuthor(p: PostWithAuthorRow): Post {
  const { author: _drop, ...rest } = p;
  void _drop;
  return rest;
}
