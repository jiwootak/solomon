"use client";

/**
 * 피드 컨테이너 — 탭 상태 관리 + PostCard 렌더링.
 * 서버 컴포넌트(app/page.tsx)에서 active / closed 두 리스트를 미리 fetch 해 props 로 전달.
 */
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FeedTabs, { type FeedTab } from "@/components/feed/FeedTabs";
import PostCard from "@/components/feed/PostCard";
import type { PostWithOptions } from "@/types/solomon";

interface FeedViewProps {
  activePosts: PostWithOptions[];
  closedPosts: PostWithOptions[];
  /** Supabase 미설정 (데모 모드) 여부 */
  isDemo?: boolean;
}

export default function FeedView({
  activePosts,
  closedPosts,
  isDemo,
}: FeedViewProps) {
  const [tab, setTab] = useState<FeedTab>("active");
  const posts = tab === "active" ? activePosts : closedPosts;

  return (
    <div className="container-mobile pt-4">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">모두의 솔로몬</h1>
        {isDemo ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            데모 모드
          </span>
        ) : null}
      </div>

      <FeedTabs
        activeTab={tab}
        onChange={setTab}
        activeCount={activePosts.length}
        closedCount={closedPosts.length}
      />

      {/* 피드 */}
      <section
        id={`feed-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`feed-tab-${tab}`}
        className="mt-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3 pb-8"
          >
            {posts.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}

function EmptyState({ tab }: { tab: FeedTab }) {
  if (tab === "closed") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
        <p className="text-3xl">🗳️</p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          아직 종료된 게시글이 없어요
        </p>
        <p className="mt-1 text-xs text-slate-500">
          24시간 후 결과가 공개됩니다.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
      <p className="text-3xl">✏️</p>
      <p className="mt-2 text-sm font-medium text-slate-700">
        아직 게시글이 없어요
      </p>
      <p className="mt-1 text-xs text-slate-500">
        첫 번째 솔로몬을 찾아주세요!
      </p>
      <Link
        href="/post/create"
        className="mt-4 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        새 글 작성
      </Link>
    </div>
  );
}
