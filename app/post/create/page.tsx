"use client";

/**
 * 게시글 작성 페이지.
 *
 * 동작:
 *   1) 마운트 시 supabase.auth.getUser() 로 로그인 확인 — 미로그인이면 /login 으로 리다이렉트
 *   2) 폼:
 *      - content: textarea (최대 500자, 글자 수 표시)
 *      - options: 2~4개, 동적 추가/제거 (AnimatePresence)
 *      - image_url: URL 텍스트 입력 (Supabase Storage 업로드는 Phase 5 에서)
 *   3) POST /api/posts 호출 → 성공 시 /post/{id} 이동
 *   4) 클라이언트 검증: content 필수, 옵션 2개 이상 + 모두 비어있지 않음 + 중복 금지
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_CONTENT = 500;
const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;
const MAX_OPTION_LEN = 50;

interface OptionInput {
  /** UI 키 — 추가/제거 시 안정적인 key 보장용 */
  key: string;
  text: string;
}

export default function PostCreatePage() {
  const router = useRouter();

  // 인증 확인 (미들웨어 가드가 있지만 클라이언트 측에서도 확인)
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user) {
          router.replace("/login?redirect=/post/create");
          return;
        }
        setAuthChecked(true);
      } catch (e) {
        // env 미설정 등 — 미들웨어가 있으니 이 경로 도달 가능성은 낮음
        console.error("[post/create] auth check failed", e);
        if (!cancelled) router.replace("/login?redirect=/post/create");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // 폼 상태
  const [content, setContent] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { key: "opt-1", text: "" },
    { key: "opt-2", text: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 검증
  const validation = useMemo(() => validateForm(content, options), [content, options]);

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [
      ...prev,
      { key: `opt-${Date.now()}-${prev.length + 1}`, text: "" },
    ]);
  }

  function removeOption(key: string) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((o) => o.key !== key));
  }

  function updateOption(key: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, text } : o)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    if (!validation.ok) {
      setErrorMsg(validation.message);
      toast.error(validation.message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          options: options.map((o, i) => ({
            option_text: o.text.trim(),
            option_order: i + 1,
          })),
        }),
      });

      if (!res.ok) {
        let message = "게시글 작성에 실패했습니다";
        try {
          const data = (await res.json()) as { error?: string; message?: string };
          if (data?.error) message = data.error;
          else if (data?.message) message = data.message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      const data = (await res.json()) as { post?: { id: string }; id?: string };
      const newId = data.post?.id ?? data.id;
      if (!newId) throw new Error("응답에 게시글 id 가 없습니다");

      toast.success("게시글이 등록되었습니다 ✓");
      router.push(`/post/${newId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "게시글 작성에 실패했습니다";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // 인증 확인 전 — 깜빡임 방지용 빈 화면
  if (!authChecked) {
    return (
      <div className="container-mobile py-4">
        <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>
    );
  }

  const charLeft = MAX_CONTENT - content.length;
  const charDanger = charLeft < 0;
  const charWarn = !charDanger && charLeft <= 30;

  return (
    <div className="container-mobile py-4">
      {/* 헤더 */}
      <header className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          aria-label="피드로 돌아가기"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-slate-900">새 게시글</h1>
        <div className="w-9" aria-hidden />
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 본문 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="content" className="mb-2 block text-xs font-semibold text-slate-700">
            고민/딜레마 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="여러분의 판단을 듣고 싶은 상황을 적어주세요. (최대 500자)"
            rows={6}
            className={cn(
              "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100",
              charDanger && "border-red-300 focus:border-red-400 focus:ring-red-100",
            )}
            maxLength={MAX_CONTENT + 100} // soft 캡 — 검증은 별도
          />
          <div className="mt-1.5 flex justify-end text-[11px] tabular-nums">
            <span
              className={cn(
                "font-medium",
                charDanger ? "text-red-500" : charWarn ? "text-amber-600" : "text-slate-500",
              )}
            >
              {content.length} / {MAX_CONTENT}
            </span>
          </div>
        </section>

        {/* 선택지 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              선택지 <span className="text-red-500">*</span>{" "}
              <span className="font-normal text-slate-400">({MIN_OPTIONS}~{MAX_OPTIONS}개)</span>
            </span>
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= MAX_OPTIONS}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                options.length >= MAX_OPTIONS
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              추가
            </button>
          </div>

          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {options.map((opt, idx) => (
                <motion.li
                  key={opt.key}
                  layout
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
                    >
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(opt.key, e.target.value)}
                      placeholder={`선택지 ${idx + 1}`}
                      maxLength={MAX_OPTION_LEN + 10}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(opt.key)}
                      disabled={options.length <= MIN_OPTIONS}
                      aria-label={`선택지 ${idx + 1} 삭제`}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        options.length <= MIN_OPTIONS
                          ? "cursor-not-allowed text-slate-300"
                          : "text-slate-500 hover:bg-red-50 hover:text-red-500",
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {errorMsg ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
              role="alert"
            >
              {errorMsg}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* 안내 + 제출 */}
        <div className="rounded-xl bg-indigo-50 px-3 py-2.5 text-[11px] text-indigo-700">
          ⏳ 게시 후 24시간 동안 투표가 진행됩니다. 그 동안에는 결과가 비공개됩니다.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "mt-1 flex h-12 items-center justify-center rounded-2xl bg-indigo-600 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-colors",
            "hover:bg-indigo-700 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none",
          )}
        >
          {submitting ? "등록 중…" : "게시글 등록"}
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

function validateForm(
  content: string,
  options: OptionInput[],
): { ok: true } | { ok: false; message: string } {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, message: "내용을 입력해 주세요" };
  if (trimmed.length > MAX_CONTENT)
    return { ok: false, message: `내용은 최대 ${MAX_CONTENT}자까지 입력할 수 있습니다` };

  if (options.length < MIN_OPTIONS)
    return { ok: false, message: `선택지를 최소 ${MIN_OPTIONS}개 입력해 주세요` };
  if (options.length > MAX_OPTIONS)
    return { ok: false, message: `선택지는 최대 ${MAX_OPTIONS}개까지 입력할 수 있습니다` };

  const texts = options.map((o) => o.text.trim());
  if (texts.some((t) => !t)) return { ok: false, message: "비어있는 선택지가 있습니다" };
  if (texts.some((t) => t.length > MAX_OPTION_LEN))
    return { ok: false, message: `선택지는 ${MAX_OPTION_LEN}자 이하로 입력해 주세요` };

  const norm = texts.map((t) => t.toLowerCase().replace(/\s+/g, " "));
  if (new Set(norm).size !== norm.length)
    return { ok: false, message: "중복된 선택지가 있습니다" };

  return { ok: true };
}
