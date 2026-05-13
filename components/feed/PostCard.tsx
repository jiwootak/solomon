"use client";

/**
 * 피드 카드 — 게시글 한 건을 표시.
 *
 * ★ 블라인드 룰:
 *   - isExpired() 가 false 면 vote_count / 비율 / 결과를 절대 노출하지 않는다.
 *   - 진행중에는 선택지 갯수와 카운트다운만 표시.
 *   - 종료된 후에는 "솔로몬의 선택" (최다 득표 선택지) 을 앰버로 강조.
 */
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { isExpired, remainingMs, type PostWithOptions } from "@/types/solomon";
import { formatRemaining, cn } from "@/lib/utils";

interface PostCardProps {
  post: PostWithOptions;
  /** 종료된 게시글에서 본인 투표가 1위와 일치했는지 표시할 때 활용 */
  userVoteOptionId?: string | null;
  /** 등장 애니메이션 stagger 인덱스 */
  index?: number;
}

export default function PostCard({ post, userVoteOptionId, index = 0 }: PostCardProps) {
  const expired = isExpired(post);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04, ease: "easeOut" }}
      className="w-full"
    >
      <Link
        href={`/post/${post.id}`}
        className={cn(
          "group block rounded-2xl border border-slate-200 bg-white p-4",
          "shadow-sm transition-all hover:border-indigo-200 hover:shadow-md",
          "active:scale-[0.99]",
        )}
      >
        {/* 작성자 + 상태 */}
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              url={post.author?.avatar_url ?? null}
              nickname={post.author?.nickname ?? "익명"}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700">
                {post.author?.nickname ?? "익명"}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatRelative(post.created_at)}
              </span>
            </div>
          </div>
          <StatusBadge expired={expired} />
        </header>

        {/* 본문 */}
        <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-900">
          {post.content}
        </p>

        {/* 푸터 — 진행중 vs 종료 분기 */}
        {expired ? (
          <ClosedFooter post={post} userVoteOptionId={userVoteOptionId} />
        ) : (
          <ActiveFooter post={post} />
        )}
      </Link>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function Avatar({ url, nickname }: { url: string | null; nickname: string }) {
  const initial = nickname.charAt(0).toUpperCase() || "?";
  if (url) {
    return (
      <Image
        src={url}
        alt={nickname}
        width={32}
        height={32}
        unoptimized
        className="h-8 w-8 rounded-full object-cover bg-slate-100"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
    >
      {initial}
    </span>
  );
}

function StatusBadge({ expired }: { expired: boolean }) {
  if (expired) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
        종료됨
      </span>
    );
  }
  return (
    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
      진행중
    </span>
  );
}

/** 진행중 — 카운트다운 + 선택지 개수 (블라인드 엄수) */
function ActiveFooter({ post }: { post: PostWithOptions }) {
  const [remaining, setRemaining] = useState(() => remainingMs(post));

  useEffect(() => {
    const t = setInterval(() => setRemaining(remainingMs(post)), 1000);
    return () => clearInterval(t);
  }, [post]);

  const optionCount = post.options?.length ?? 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <ClockIcon className="h-3.5 w-3.5" />
        <span className="font-medium tabular-nums text-slate-700">
          {formatRemaining(remaining)}
        </span>
        <span className="text-slate-300">·</span>
        <span>선택지 {optionCount}개</span>
      </div>
      <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
        투표하기 →
      </span>
    </div>
  );
}

/** 종료됨 — 솔로몬의 선택 표시 */
function ClosedFooter({
  post,
  userVoteOptionId,
}: {
  post: PostWithOptions;
  userVoteOptionId?: string | null;
}) {
  /**
   * vote_count 가 옵션에 포함되어 있으면 그것을 1위로 사용,
   * 없으면 단순히 "결과 보기" 안내만 표시.
   * (vote_count 는 RPC 호출 후에만 채워지므로, 피드에서는 보통 비어있음)
   */
  const winner = pickWinner(post);
  const userMatched = userVoteOptionId && winner && userVoteOptionId === winner.id;

  return (
    <div className="space-y-2">
      {winner ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2",
            "border border-amber-200",
          )}
        >
          <span aria-hidden className="text-base">⚖️</span>
          <span className="text-xs font-medium text-amber-700">솔로몬의 선택:</span>
          <span className="flex-1 truncate text-sm font-semibold text-amber-900">
            {winner.option_text}
          </span>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          결과 확인하러 가기 →
        </div>
      )}

      {userMatched ? (
        <p className="text-[11px] font-medium text-emerald-600">
          ✨ 내 선택이 솔로몬의 선택과 일치했어요
        </p>
      ) : null}
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function pickWinner(post: PostWithOptions) {
  if (!post.options?.length) return null;
  // vote_count 가 채워져 있을 때만 의미 있음
  const hasCounts = post.options.some(
    (o) => typeof o.vote_count === "number" && (o.vote_count ?? 0) > 0,
  );
  if (!hasCounts) return null;

  return [...post.options].sort((a, b) => {
    const av = a.vote_count ?? 0;
    const bv = b.vote_count ?? 0;
    if (bv !== av) return bv - av;
    return a.option_order - b.option_order;
  })[0];
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
