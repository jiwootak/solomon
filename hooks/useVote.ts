"use client";

/**
 * useVote — 낙관적 업데이트 + 실패 롤백 투표 훅.
 *
 * 사용 예:
 *   const { vote, isVoting, userVoteOptionId, setUserVoteOptionId } =
 *     useVote(initialMyVote?.option_id ?? null);
 *
 *   await vote(post.id, option.id);
 *
 * 흐름:
 *   1) userVoteOptionId 를 즉시 optionId 로 업데이트 (낙관적)
 *   2) POST /api/vote 호출
 *   3) 실패 시 이전 값으로 롤백 + toast.error
 *   4) 성공 시 toast.success
 *
 * 주의:
 *   - 한 번 투표한 뒤에는 정책상 변경 불가 — UI 측에서 isSelected 인 다른 버튼은 비활성.
 *   - 그러나 훅 자체는 setter 를 노출하여 페이지 측에서 초기 상태(서버 fetch 결과)를 주입할 수 있음.
 */
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface UseVoteResult {
  /**
   * 투표 실행. postId/optionId 를 서버로 전송.
   * 실패 시 throw 하지 않고 false 를 반환 — 호출 측은 await 만 해도 충분.
   */
  vote: (postId: string, optionId: string) => Promise<boolean>;
  isVoting: boolean;
  userVoteOptionId: string | null;
  setUserVoteOptionId: (id: string | null) => void;
}

export function useVote(initialOptionId: string | null = null): UseVoteResult {
  const [userVoteOptionId, setUserVoteOptionId] = useState<string | null>(initialOptionId);
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async (postId: string, optionId: string): Promise<boolean> => {
      // 이미 투표했거나 진행 중이면 무시
      if (isVoting) return false;
      if (userVoteOptionId) return false;

      const previous = userVoteOptionId;

      // 1) 낙관적 업데이트
      setUserVoteOptionId(optionId);
      setIsVoting(true);

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId, option_id: optionId }),
        });

        if (!res.ok) {
          // 응답 본문에서 에러 메시지 추출 (가능하면)
          let message = "투표 처리 중 오류가 발생했습니다";
          try {
            const data = (await res.json()) as { error?: string; message?: string };
            if (data?.error) message = data.error;
            else if (data?.message) message = data.message;
          } catch {
            /* json 파싱 실패는 무시 */
          }
          throw new Error(message);
        }

        toast.success("투표가 완료되었습니다 ✓");
        return true;
      } catch (e) {
        // 3) 롤백
        setUserVoteOptionId(previous);
        const message =
          e instanceof Error && e.message
            ? e.message
            : "투표 처리 중 오류가 발생했습니다";
        toast.error(message);
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [isVoting, userVoteOptionId],
  );

  return { vote, isVoting, userVoteOptionId, setUserVoteOptionId };
}

export default useVote;
