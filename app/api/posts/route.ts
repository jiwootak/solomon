export const dynamic = "force-dynamic";
/**
 * /api/posts
 *
 * GET  — 피드 목록 조회 (블라인드 룰 강제: active 게시글은 vote_count 미포함)
 *   query: ?status=active|closed&page=1&limit=20
 *   응답:  { posts: PostWithOptions[], total: number, page: number, limit: number }
 *
 * POST — 게시글 작성
 *   body:  { content: string, options: string[], image_url?: string }
 *   응답:  { post: Post, options: Option[] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Option, Post, PostWithOptions } from "@/types/solomon";

// ============================================================================
// 상수
// ============================================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

const MIN_CONTENT_LEN = 1;
const MAX_CONTENT_LEN = 500;
const MAX_OPTION_LEN = 80;

// ============================================================================
// GET — 피드 조회
// ============================================================================

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status: "active" | "closed" | "all" =
    statusParam === "active" || statusParam === "closed" ? statusParam : "all";

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limitRaw =
    Number(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT)) ||
    DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();

  // 게시글 + 선택지 + 작성자 (블라인드: vote_count 는 절대 SELECT 하지 않음)
  let query = supabase
    .from("posts")
    .select(
      `
        id, user_id, content, image_url, created_at, expires_at, status,
        options:options ( id, post_id, option_text, option_order, created_at ),
        author:users!posts_user_id_fkey ( id, nickname, avatar_url )
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "피드 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  // 현재 유저의 투표 정보 (있으면) — 본인 votes 만 RLS 로 조회 가능
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myVotesByPost: Record<string, string> = {};
  if (user && data && data.length > 0) {
    const postIds = data.map((p) => p.id);
    const { data: myVotes } = await supabase
      .from("votes")
      .select("post_id, option_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    if (myVotes) {
      myVotesByPost = Object.fromEntries(
        myVotes.map((v) => [v.post_id, v.option_id]),
      );
    }
  }

  // ---------------------------------------------------------------- 정규화
  const posts: PostWithOptions[] = (data ?? []).map((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    const options: Option[] = ((row.options ?? []) as Option[])
      .slice()
      .sort((a, b) => a.option_order - b.option_order);

    const my_vote_option_id = myVotesByPost[row.id] ?? null;

    return {
      id: row.id,
      user_id: row.user_id,
      content: row.content,
      image_url: row.image_url,
      created_at: row.created_at,
      expires_at: row.expires_at,
      status: row.status,
      options,
      author: author
        ? {
            id: author.id,
            nickname: author.nickname,
            avatar_url: author.avatar_url,
          }
        : undefined,
      my_vote: my_vote_option_id ? { option_id: my_vote_option_id } : null,
    };
  });

  return NextResponse.json({
    posts,
    total: count ?? posts.length,
    page,
    limit,
  });
}

// ============================================================================
// POST — 게시글 작성
// ============================================================================

interface OptionInput {
  option_text?: unknown;
  option_order?: unknown;
}

interface CreatePostBody {
  content?: unknown;
  options?: unknown;
  image_url?: unknown;
}

export async function POST(request: Request) {
  // ---------------------------------------------------------------- 인증
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

  // ---------------------------------------------------------------- body parse
  let body: CreatePostBody;
  try {
    body = (await request.json()) as CreatePostBody;
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON 이 아닙니다." },
      { status: 400 },
    );
  }

  // content
  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: "content 가 필요합니다." },
      { status: 400 },
    );
  }
  const content = body.content.trim();
  if (content.length < MIN_CONTENT_LEN || content.length > MAX_CONTENT_LEN) {
    return NextResponse.json(
      {
        error: `content 는 ${MIN_CONTENT_LEN}~${MAX_CONTENT_LEN}자 이내여야 합니다.`,
      },
      { status: 400 },
    );
  }

  // options
  if (!Array.isArray(body.options)) {
    return NextResponse.json(
      { error: "options 배열이 필요합니다." },
      { status: 400 },
    );
  }
  // 클라이언트는 { option_text, option_order }[] 형태로 전송하므로 두 형식 모두 지원
  const optionTexts: string[] = (body.options as unknown[])
    .map((o: unknown): string => {
      if (typeof o === "string") return o.trim();
      if (o !== null && typeof o === "object") {
        const obj = o as OptionInput;
        if (typeof obj.option_text === "string") return obj.option_text.trim();
      }
      return "";
    })
    .filter((t) => t.length > 0);

  if (optionTexts.length < MIN_OPTIONS || optionTexts.length > MAX_OPTIONS) {
    return NextResponse.json(
      {
        error: `선택지는 ${MIN_OPTIONS}~${MAX_OPTIONS}개여야 합니다.`,
      },
      { status: 400 },
    );
  }
  if (optionTexts.some((o) => o.length > MAX_OPTION_LEN)) {
    return NextResponse.json(
      { error: `선택지는 각 ${MAX_OPTION_LEN}자 이내여야 합니다.` },
      { status: 400 },
    );
  }
  // 중복 방지
  if (new Set(optionTexts).size !== optionTexts.length) {
    return NextResponse.json(
      { error: "선택지에 중복된 항목이 있습니다." },
      { status: 400 },
    );
  }

  // image_url (옵셔널)
  const image_url =
    typeof body.image_url === "string" && body.image_url.length > 0
      ? body.image_url
      : null;

  // ---------------------------------------------------------------- INSERT post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content,
      image_url,
    })
    .select("id, user_id, content, image_url, created_at, expires_at, status")
    .single();

  if (postError || !post) {
    return NextResponse.json(
      { error: "게시글 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  // ---------------------------------------------------------------- INSERT options
  const optionRows = optionTexts.map((text, i) => ({
    post_id: post.id,
    option_text: text,
    option_order: i + 1,
  }));

  const { data: options, error: optionsError } = await supabase
    .from("options")
    .insert(optionRows)
    .select("id, post_id, option_text, option_order, created_at");

  if (optionsError || !options) {
    // 보상 트랜잭션: post 롤백
    await supabase.from("posts").delete().eq("id", post.id);
    return NextResponse.json(
      { error: "선택지 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      post: post as Post,
      options: options.sort((a, b) => a.option_order - b.option_order),
    },
    { status: 201 },
  );
}
