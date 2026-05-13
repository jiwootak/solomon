"use client";

/**
 * CountdownTimer — 게시글 상세 페이지 상단의 큰 카운트다운.
 *
 * - 1시간 미만 남으면 빨간색(`text-red-500`)으로 강조.
 * - 24시간 이상 남았으면 "X일 Y시간 Z분" 형식.
 * - 초 단위로 살짝 스케일 효과(motion).
 */
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import useCountdown from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

export default function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const { displayText, urgent, expired, seconds } = useCountdown(expiresAt);

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm",
        expired
          ? "border-slate-200 text-slate-500"
          : urgent
            ? "border-red-200 bg-red-50 text-red-500"
            : "border-indigo-100 text-slate-700",
        className,
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <Clock
        className={cn(
          "h-4 w-4 shrink-0",
          expired ? "text-slate-400" : urgent ? "text-red-500" : "text-indigo-500",
        )}
        aria-hidden
      />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {expired ? "투표 종료" : "남은 시간"}
      </span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          // 초 단위로 키가 바뀌어 마이크로 스케일 애니메이션 트리거
          key={seconds}
          initial={{ scale: 0.92, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "ml-1 text-lg font-bold tabular-nums",
            expired ? "text-slate-500" : urgent ? "text-red-500" : "text-slate-900",
          )}
        >
          {displayText}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
