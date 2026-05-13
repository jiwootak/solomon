"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, EyeOff, Flag, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  isExpired as computeIsExpired,
  type PostWithOptions,
  type Option,
  type Post,
  type User,
} from "@/types/solomon";
import { cn } from "@/lib/utils";
import CountdownTimer from "@/components/post/CountdownTimer";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";
import useVote from "@/hooks/useVote";

const REPORT_REASONS = [
  "욕설/혐오 표현",
  "개인정보 노출",
  "허위 정보/스팸",
  "음란/성적 콘텐츠",
  "기타",
] as const;

interface FetchPostResponse {
  post: Post;
  author: Pick<User, "id" | "nickname" | "avatar_url"> | null;
  options: Option[];
  user_vote_option_id: string | null;
  current_user_id: string | null;
  solomon_choice?: string | null;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; status: number; message: string }
  | { kind: "ok"; post: PostWithOptions; solomonChoiceId: string | null; currentUserId: string | null };

export default function PostDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const initialMyVote = state.kind === "ok" ? state.post.my_vote?.option_id ?? null : null;
  const { vote, isVoting, userVoteOptionId, setUserVoteOptionId } = useVote(initialMyVote);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled)
            setState({
              kind: "error",
              status: res.status,
              message: res.status === 404 ? "게시글을 찾을 수 없습니다" : "불러오기 실패",
            });
          return;
        }
        const data = (await res.json()) as FetchPostResponse;
        if (!cancelled) {
          const postWithOptions: PostWithOptions = {
            ...data.post,
            author: data.author ?? undefined,
            options: data.options ?? [],
            my_vote: data.user_vote_option_id
              ? { option_id: data.user_vote_option_id }
              : null,
          };
          setState({
            kind: "ok",
            post: postWithOptions,
            solomonChoiceId: data.solomon_choice ?? null,
            currentUserId: data.current_user_id ?? null,
          });
          setUserVoteOptionId(data.user_vote_option_id ?? null);
        }
      } catch (e) {
        console.error("[post detail] load failed", e);
        if (!cancelled)
          setState({ kind: "error", status: 0, message: "네트워크 오류가 발생했습니다" });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state.kind === "loading") return <PostDetailSkeleton />;
  if (state.kind === "error") return <PostDetailError state={state} onBack={() => router.back()} />;

  return (
    <PostDetailView
      post={state.post}
      solomonChoiceId={state.solomonChoiceId}
      currentUserId={state.currentUserId}
      userVoteOptionId={userVoteOptionId}
      onVote={(optionId) => vote(state.post.id, optionId)}
      isVoting={isVoting}
      onDeleted={() => router.push("/")}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                        */
/* -------------------------------------------------------------------------- */

function PostDetailView({
  post,
  solomonChoiceId,
  currentUserId,
  userVoteOptionId,
  onVote,
  isVoting,
  onDeleted,
}: {
  post: PostWithOptions;
  solomonChoiceId: string | null;
  currentUserId: string | null;
  userVoteOptionId: string | null;
  onVote: (optionId: string) => void | Promise<unknown>;
  isVoting: boolean;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const expired = computeIsExpired(post);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!currentUserId && currentUserId === post.user_id;
  const canReport = !!currentUserId && !isOwner;

  const sortedOptions = useMemo(
    () => [...post.options].sort((a, b) => a.option_order - b.option_order),
    [post.options],
  );

  const pendingOption = pendingOptionId
    ? sortedOptions.find((o) => o.id === pendingOptionId)
    : null;

  const solomonChoice: Option | undefined = useMemo(() => {
    if (!expired) return undefined;
    if (solomonChoiceId) return post.options.find((o) => o.id === solomonChoiceId);
    if (post.options.some((o) => typeof o.vote_count === "number")) {
      return [...post.options].sort((a, b) => {
        const av = a.vote_count ?? 0;
        const bv = b.vote_count ?? 0;
        if (bv !== av) return bv - av;
        return a.option_order - b.option_order;
      })[0];
    }
    return undefined;
  }, [expired, post.options, solomonChoiceId]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      toast.success("게시글이 삭제되었습니다.");
      onDeleted();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="container-mobile py-4">
      {/* 헤더 */}
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-900">
            {expired ? "결과 보기" : "투표하기"}
          </h1>
        </div>

        {/* 작성자: 삭제 버튼 / 타인: 신고 버튼 */}
        <div className="flex items-center gap-1">
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="게시글 삭제"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
          {canReport && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              aria-label="게시글 신고"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* 작성자 + 본문 */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Avatar url={post.author?.avatar_url ?? null} nickname={post.author?.nickname ?? "익명"} />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">
              {post.author?.nickname ?? "익명"}
            </span>
            <span className="text-[11px] text-slate-400">{formatRelative(post.created_at)}</span>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-900">
          {post.content}
        </p>
        {post.image_url ? (
          <div className="relative mt-3 h-80 w-full overflow-hidden rounded-xl">
            <Image src={post.image_url} alt="" fill unoptimized className="object-cover" />
          </div>
        ) : null}
      </motion.section>

      {/* 카운트다운 / 종료 배너 */}
      <section className="mt-4">
        {expired ? (
          solomonChoice ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 px-4 py-3.5 shadow-sm"
            >
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">솔로몬의 선택</p>
                <p className="truncate text-base font-bold text-amber-900">{solomonChoice.option_text}</p>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              결과 집계 중입니다.
            </div>
          )
        ) : (
          <CountdownTimer expiresAt={post.expires_at} />
        )}
      </section>

      {/* 투표 / 결과 */}
      <section className="mt-5">
        {expired ? (
          <ResultBar options={sortedOptions} solomonChoiceId={solomonChoice?.id} userVoteOptionId={userVoteOptionId} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sortedOptions.map((opt) => (
              <VoteButton
                key={opt.id}
                option={opt}
                isSelected={userVoteOptionId === opt.id}
                isPending={!userVoteOptionId && pendingOptionId === opt.id}
                isExpired={false}
                hasVoted={!!userVoteOptionId}
                isVoting={isVoting}
                onVote={(optionId) => {
                  if (userVoteOptionId) return;
                  setPendingOptionId((prev) => (prev === optionId ? null : optionId));
                }}
              />
            ))}

            <AnimatePresence>
              {pendingOption && !userVoteOptionId ? (
                <motion.div
                  key="confirm-bar"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-1 flex flex-col gap-2"
                >
                  <button
                    type="button"
                    disabled={isVoting}
                    onClick={() => { void onVote(pendingOption.id); setPendingOptionId(null); }}
                    className={cn(
                      "w-full rounded-2xl bg-indigo-600 px-4 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-indigo-200",
                      "transition-all active:scale-[0.98]",
                      isVoting ? "cursor-not-allowed opacity-60" : "hover:bg-indigo-700",
                    )}
                  >
                    {isVoting ? "투표 중…" : `「${pendingOption.option_text}」로 투표하기`}
                  </button>
                  <button
                    type="button"
                    disabled={isVoting}
                    onClick={() => setPendingOptionId(null)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
                  >
                    취소
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </section>

      {!expired ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-5 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100/70 px-3 py-2.5 text-center text-xs text-slate-500"
        >
          <EyeOff className="h-3.5 w-3.5" />
          <span>⏳ 투표 결과는 24시간 후 공개됩니다</span>
        </motion.p>
      ) : null}

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <Modal onClose={() => setShowDeleteConfirm(false)}>
            <div className="p-6 text-center">
              <p className="text-3xl mb-3">🗑️</p>
              <h2 className="text-base font-bold text-slate-900 mb-2">게시글을 삭제할까요?</h2>
              <p className="text-xs text-slate-500 mb-5">삭제하면 투표 기록도 함께 사라집니다.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* 신고 모달 */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            postId={post.id}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Report Modal                                                                */
/* -------------------------------------------------------------------------- */

function ReportModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, reason: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "신고에 실패했습니다.");
        return;
      }
      toast.success("신고가 접수되었습니다. 검토 후 조치합니다.");
      onClose();
    } catch {
      toast.error("신고 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-5">
        <h2 className="mb-1 text-base font-bold text-slate-900">게시글 신고</h2>
        <p className="mb-4 text-xs text-slate-500">신고 사유를 선택해 주세요.</p>
        <ul className="flex flex-col gap-2 mb-5">
          {REPORT_REASONS.map((reason) => (
            <li key={reason}>
              <button
                type="button"
                onClick={() => setSelected(reason)}
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                  selected === reason
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                {reason}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!selected || submitting}
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "신고 중…" : "신고하기"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Wrapper                                                               */
/* -------------------------------------------------------------------------- */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

function PostDetailSkeleton() {
  return (
    <div className="container-mobile animate-pulse py-4" aria-busy>
      <div className="mb-4 h-9 w-24 rounded-full bg-slate-200" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div className="space-y-1">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-2 w-12 rounded bg-slate-200" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 h-12 rounded-2xl bg-slate-200" />
      <div className="mt-5 space-y-2.5">
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function PostDetailError({ state, onBack }: { state: { status: number; message: string }; onBack: () => void }) {
  const is404 = state.status === 404;
  return (
    <div className="container-mobile flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 text-5xl" aria-hidden>{is404 ? "🤷" : "⚠️"}</div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        {is404 ? "게시글을 찾을 수 없습니다" : "불러오지 못했습니다"}
      </h2>
      <p className="mb-6 max-w-xs text-sm text-slate-500">
        {is404 ? "삭제되었거나 존재하지 않는 게시글입니다." : state.message || "잠시 후 다시 시도해 주세요."}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          뒤로 가기
        </button>
        <Link href="/" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          홈으로
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function Avatar({ url, nickname }: { url: string | null; nickname: string }) {
  const initial = nickname.charAt(0).toUpperCase() || "?";
  if (url) {
    return (
      <Image src={url} alt={nickname} width={32} height={32} unoptimized
        className="h-8 w-8 rounded-full bg-slate-100 object-cover" />
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
      {initial}
    </span>
  );
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
