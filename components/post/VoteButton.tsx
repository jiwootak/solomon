"use client";

/**
 * VoteButton — 게시글 상세 페이지의 선택지 버튼.
 *
 * 상태:
 *   - 미투표 + 진행중: 인디고 테두리 버튼 (클릭 가능)
 *   - 본인 선택 후: 인디고 배경 + 흰 텍스트 + 체크 아이콘
 *   - 다른 선택지(이미 투표한 경우): 흐리게(opacity-50), 비활성
 *   - 종료 후: 모두 비활성
 *
 * Framer Motion: tap 시 scale 0.97
 */
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Option } from "@/types/solomon";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  option: Option;
  /** 확정된 내 투표 옵션인지 */
  isSelected: boolean;
  /** 선택했지만 아직 확정하지 않은 상태 */
  isPending?: boolean;
  /** 게시글이 종료됐는지 (만료 후) */
  isExpired: boolean;
  /** 확정 투표가 완료됐는지 — 다른 옵션 비활성 처리용 */
  hasVoted?: boolean;
  /** 클릭 핸들러 */
  onVote: (optionId: string) => void;
  /** 투표 전송 중 여부 — 중복 클릭 방지 */
  isVoting: boolean;
}

export default function VoteButton({
  option,
  isSelected,
  isPending = false,
  isExpired,
  hasVoted = false,
  onVote,
  isVoting,
}: VoteButtonProps) {
  // 확정 투표 완료 후 다른 옵션 비활성, 만료/전송중도 비활성
  const disabled = isExpired || isVoting || (hasVoted && !isSelected);

  const dim = hasVoted && !isSelected;

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (disabled) return;
        onVote(option.id);
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled}
      aria-pressed={isSelected || isPending}
      aria-disabled={disabled}
      className={cn(
        "group relative flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150",
        // 기본 (미선택 + 클릭 가능)
        !isSelected && !isPending && !disabled &&
          "border-indigo-200 bg-white text-slate-900 hover:border-indigo-400 hover:bg-indigo-50",
        // pending — 선택했지만 미확정
        isPending &&
          "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm shadow-indigo-100",
        // 확정 선택
        isSelected &&
          "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200",
        // 흐리게 (확정 투표 완료 후 다른 옵션)
        dim && "opacity-40",
        // 비활성 (만료 등)
        !isSelected && !isPending && disabled && "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500",
        disabled && "cursor-not-allowed",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
            isSelected ? "bg-white/20 text-white" : "",
            isPending ? "bg-indigo-500 text-white" : "",
            !isSelected && !isPending && !disabled && "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200",
            !isSelected && !isPending && disabled && "bg-slate-200 text-slate-500",
          )}
          aria-hidden
        >
          {option.option_order}
        </span>
        <span className="truncate text-base font-medium">{option.option_text}</span>
      </span>

      {isSelected ? (
        <motion.span
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20"
          aria-label="내 선택"
        >
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </motion.span>
      ) : null}
    </motion.button>
  );
}
