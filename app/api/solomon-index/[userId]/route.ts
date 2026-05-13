export const dynamic = "force-dynamic";
/**
 * GET /api/solomon-index/[userId]
 *
 * 특정 사용자의 솔로몬 지수와 칭호를 반환한다.
 *
 * 계산 로직 (lib/solomon.ts 와 1:1 동기화)
 *   index = total_votes === 0 ? 0 : round(matched / total * 100, 1)
 *
 * 칭호 매핑 (AGENTS.md / schema.sql 의 get_user_solomon_index() 와 일치)
 *   total_votes = 0     → 🌱 새내기 솔로몬
 *   index >= 90         → 👑 진정한 솔로몬
 *   index >= 70         → ⚖️ 현명한 판단자
 *   index >= 50         → 🤔 고민하는 시민
 *   index >= 30         → 🌊 역류하는 물고기
 *   else                → 🎸 마이웨이 힙스터
 *
 * 응답
 *   200 { user_id, index, title, total_votes, matched }
 *   400 { error } — userId 형식 오류
 *   404 { error } — 사용자 없음
 *   500 { error } — 내부 오류
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSolomonData } from "@/lib/solomon";

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(_request: Request, ctx: RouteContext) {
  const { userId } = await ctx.params;

  if (!UUID_RE.test(userId)) {
    return NextResponse.json(
      { error: "userId 가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, total_votes, majority_matched_votes")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "솔로몬 지수 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
  if (!user) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const data = getSolomonData(user);

  return NextResponse.json({
    user_id: data.user_id,
    index: data.index,
    title: data.title,
    total_votes: data.total_votes,
    matched: data.matched,
  });
}
