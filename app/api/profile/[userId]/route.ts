export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSolomonData } from "@/lib/solomon";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, ctx: RouteContext) {
  const { userId } = await ctx.params;

  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "잘못된 userId입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: "사용자 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  const solomon_index = getSolomonData(user);

  // 작성한 게시글 (최근 10개)
  const { data: authored_posts } = await supabase
    .from("posts")
    .select("id, content, status, expires_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // 투표한 게시글 (최근 10개) — 본인 조회 시만 포함
  let voted_posts: unknown[] = [];
  if (authUser?.id === userId) {
    const { data: votes } = await supabase
      .from("votes")
      .select("post_id, option_id, posts(id, content, status, expires_at, created_at)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    voted_posts = votes ?? [];
  }

  return NextResponse.json({
    user,
    solomon_index,
    authored_posts: authored_posts ?? [],
    voted_posts,
  });
}
