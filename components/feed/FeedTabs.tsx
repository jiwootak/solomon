"use client";

/**
 * 피드 탭 — 진행중 / 종료됨
 * Framer Motion layoutId 로 인디케이터 부드러운 전환.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type FeedTab = "active" | "closed";

interface FeedTabsProps {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
  /** 진행중 게시글 개수 (선택) */
  activeCount?: number;
  /** 종료된 게시글 개수 (선택) */
  closedCount?: number;
}

const TABS: { id: FeedTab; label: string }[] = [
  { id: "active", label: "진행중" },
  { id: "closed", label: "종료됨" },
];

export default function FeedTabs({
  activeTab,
  onChange,
  activeCount,
  closedCount,
}: FeedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="피드 필터"
      className="relative flex w-full border-b border-slate-200 bg-white"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = tab.id === "active" ? activeCount : closedCount;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`feed-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-1 py-3 text-sm font-semibold transition-colors",
              isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-700",
            )}
          >
            <span>{tab.label}</span>
            {typeof count === "number" ? (
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums",
                  isActive
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {count}
              </span>
            ) : null}

            {isActive ? (
              <motion.span
                layoutId="feed-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
