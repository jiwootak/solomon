/**
 * 모두의 솔로몬 — 서버용 솔로몬 지수 계산 유틸
 *
 * NOTE
 *  - DB 레벨 단일 소스 오브 트루스: `public.get_user_solomon_index()` RPC.
 *  - 본 모듈은 서버 라우트/Action 에서 RPC 없이 빠르게 계산할 때 사용한다.
 *  - 칭호 매핑은 AGENTS.md 와 schema.sql 의 `get_user_solomon_index()` 와 동일하게 유지해야 한다.
 */

import type { SolomonIndex, User } from "@/types/solomon";

// ============================================================================
// 칭호 임계값 — schema.sql 과 1:1 동기화
// ============================================================================

/** 새내기 시민: total_votes === 0 인 경우 별도 칭호 */
export const TITLE_NEWCOMER = "🌱 새내기 시민";

const TITLE_TIERS: ReadonlyArray<{ min: number; title: string }> = [
  { min: 90, title: "👑 진정한 솔로몬" },
  { min: 70, title: "⚖️ 현명한 판단자" },
  { min: 50, title: "🤔 고민하는 시민" },
  { min: 30, title: "🌊 역류하는 물고기" },
  { min: 0, title: "🎸 마이웨이 힙스터" },
];

// ============================================================================
// 핵심 함수
// ============================================================================

/**
 * 솔로몬 지수 계산.
 * total_votes === 0 → 0.
 * 그 외 → (matched / total) * 100, 소수점 1자리 반올림.
 */
export function calculateSolomonIndex(
  totalVotes: number,
  matchedVotes: number,
): number {
  if (!Number.isFinite(totalVotes) || !Number.isFinite(matchedVotes)) return 0;
  if (totalVotes <= 0) return 0;
  const ratio = (matchedVotes / totalVotes) * 100;
  return Math.round(ratio * 10) / 10;
}

/**
 * 지수 → 칭호 문자열.
 * total_votes === 0 인 사용자는 calling site 에서 직접 `TITLE_NEWCOMER` 사용을 권장.
 * (이 함수는 순수히 0~100 지수만 보고 칭호를 결정)
 */
export function getTitleByIndex(index: number): string {
  if (!Number.isFinite(index)) return TITLE_TIERS[TITLE_TIERS.length - 1].title;
  for (const tier of TITLE_TIERS) {
    if (index >= tier.min) return tier.title;
  }
  return TITLE_TIERS[TITLE_TIERS.length - 1].title;
}

/**
 * User 레코드로부터 SolomonIndex 객체를 만들어 반환.
 * 클라이언트 응답에 그대로 직렬화 가능한 형태.
 */
export function getSolomonData(
  user: Pick<User, "id" | "total_votes" | "majority_matched_votes">,
): SolomonIndex {
  const total = user.total_votes ?? 0;
  const matched = user.majority_matched_votes ?? 0;
  const index = calculateSolomonIndex(total, matched);
  const title = total === 0 ? TITLE_NEWCOMER : getTitleByIndex(index);

  return {
    user_id: user.id,
    total_votes: total,
    matched,
    index,
    title,
  };
}
