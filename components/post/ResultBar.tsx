"use client";

/**
 * ResultBar — 결과 공개 후 각 선택지의 득표율을 가로 막대로 표시.
 *
 * - solomonChoiceId 와 일치하는 선택지: 앰버 배경 + 👑 이모지
 * - 마운트 시 width 0 → 실제 비율로 1초 ease-out 애니메이션
 * - 퍼센트와 득표 수 동시 표시
 *
 * Props:
 *   options          : Option[] (vote_count 포함, 결과 공개 시점)
 *   solomonChoiceId? : 솔로몬의 선택(최다 득표) 옵션 id
 *   userVoteOptionId?: 본인이 투표한 옵션 id (테두리로 표시)
 */
import { motion } from "framer-motion";
import type { Option } from "@/types/solomon";
import { cn } from "@/lib/utils";

interface ResultBarProps {
  options: Option[];
  solomonChoiceId?: string;
  userVoteOptionId?: string | null;
  className?: string;
}

export default function ResultBar({
  options,
  solomonChoiceId,
  userVoteOptionId,
  className,
}: ResultBarProps) {
  const total = options.reduce((sum, o) => sum + (o.vote_count ?? 0), 0);

  // 옵션 정렬은 option_order 기준 유지 (UX 안정성)
  const sorted = [...options].sort((a, b) => a.option_order - b.option_order);

  return (
    <ul className={cn("flex flex-col gap-2.5", className)} aria-label="투표 결과">
      {sorted.map((opt, idx) => {
        const count = opt.vote_count ?? 0;
        const ratio = total > 0 ? count / total : 0;
        const percent = Math.round(ratio * 1000) / 10; // 소수점 1자리
        const isWinner = solomonChoiceId === opt.id;
        const isMine = userVoteOptionId === opt.id;

        return (
          <li
            key={opt.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-white px-4 py-3",
              isWinner ? "border-amber-300 shadow-sm shadow-amber-100" : "border-slate-200",
              isMine && !isWinner && "ring-2 ring-indigo-300 ring-offset-1",
            )}
          >
            {/* 배경 막대 */}
            <motion.div
              aria-hidden
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: idx * 0.08 }}
              className={cn(
                "absolute inset-y-0 left-0 -z-0",
                isWinner ? "bg-amber-100" : "bg-indigo-50",
              )}
            />

            {/* 전경 — 텍스트/퍼센트 */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {isWinner ? (
                  <span className="text-lg" aria-label="솔로몬의 선택">
                    👑
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      isMine
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600",
                    )}
                    aria-hidden
                  >
                    {opt.option_order}
                  </span>
                )}
                <span
                  className={cn(
                    "truncate text-sm font-semibold",
                    isWinner ? "text-amber-900" : "text-slate-900",
                  )}
                >
                  {opt.option_text}
                </span>
                {isMine ? (
                  <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                    내 선택
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
                <span
                  className={cn(
                    "text-base font-bold",
                    isWinner ? "text-amber-700" : "text-slate-700",
                  )}
                >
                  {percent}%
                </span>
                <span className="text-[11px] text-slate-500">{count}표</span>
              </div>
            </div>
          </li>
        );
      })}

      <li className="mt-1 text-center text-[11px] text-slate-400">
        총 {total}명 참여
      </li>
    </ul>
  );
}
