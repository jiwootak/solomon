export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSolomonData } from "@/lib/solomon";

export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // 3개 쿼리 병렬 실행
  const [
    { data: user, error: userError },
    { data: authored_posts },
    { data: votes },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("posts")
      .select("id, content, status, expires_at, created_at")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("votes")
      .select("post_id, option_id, posts(id, content, status, expires_at, created_at)")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (userError || !user) {
    return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    user,
    solomon_index: getSolomonData(user),
    authored_posts: authored_posts ?? [],
    voted_posts: votes ?? [],
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { nickname } = body as { nickname?: string };

  if (!nickname || nickname.trim().length < 2) {
    return NextResponse.json({ error: "닉네임은 2자 이상이어야 합니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ nickname: nickname.trim() })
    .eq("id", authUser.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "닉네임 변경 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
