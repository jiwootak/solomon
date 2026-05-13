"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── 테스트 유저 정의 ────────────────────────────────────────────────────────
const TEST_PASSWORD = "solomon2024!";
const TEST_USERS = [
  { email: "test1@solomon.dev", nickname: "김민준", desc: "현명한 판단자", color: "bg-indigo-50 border-indigo-200 text-indigo-700", badge: "👑" },
  { email: "test2@solomon.dev", nickname: "이서연", desc: "고민하는 시민",  color: "bg-emerald-50 border-emerald-200 text-emerald-700", badge: "🤔" },
  { email: "test3@solomon.dev", nickname: "박지호", desc: "마이웨이 힙스터",color: "bg-rose-50 border-rose-200 text-rose-700", badge: "🎸" },
  { email: "test4@solomon.dev", nickname: "최유나", desc: "새내기 시민",    color: "bg-amber-50 border-amber-200 text-amber-700", badge: "🌱" },
] as const;

const PAGE_TESTS = [
  { label: "홈 피드", href: "/", desc: "진행중 / 종료됨 탭, 카드 전체 확인" },
  { label: "게시글 작성", href: "/post/create", desc: "폼 검증, 선택지 추가/제거, 제출" },
  { label: "마이페이지", href: "/my", desc: "솔로몬 지수, 내 게시글, 투표한 게시글" },
  { label: "프로필 (타인)", href: "/profile/타인-프로필-확인은-마이페이지에서-링크-클릭", desc: "공개 프로필 뷰" },
  { label: "404 페이지", href: "/does-not-exist", desc: "not-found.tsx" },
  { label: "잘못된 게시글 ID", href: "/post/invalid-id", desc: "에러 핸들링" },
] as const;

// ── 타입 ────────────────────────────────────────────────────────────────────
interface SeedPost { label: string; postId: string }
interface Toast { type: "ok" | "err" | "info"; text: string }

export default function TestPage() {
  const [currentUser, setCurrentUser] = useState<{ email: string; nickname: string } | null>(null);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [setting_up, setSettingUp] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [seedPosts, setSeedPosts] = useState<SeedPost[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const notify = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4000); };

  // ── 현재 로그인 유저 확인 ───────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setCurrentUser(null); return; }
    const { data: profile } = await sb.from("users").select("nickname").eq("id", user.id).maybeSingle();
    setCurrentUser({ email: user.email ?? "", nickname: profile?.nickname ?? user.email ?? "" });
  }, []);

  useEffect(() => { void refreshUser(); }, [refreshUser]);

  // ── 빠른 로그인 ─────────────────────────────────────────────────────────
  async function quickLogin(email: string) {
    setLoggingIn(email);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({ email, password: TEST_PASSWORD });
      if (error) {
        if (error.message.includes("Invalid login")) {
          notify({ type: "err", text: "유저가 없습니다. 먼저 '유저 생성'을 실행해주세요." });
        } else {
          notify({ type: "err", text: error.message });
        }
        return;
      }
      await refreshUser();
      notify({ type: "ok", text: `✓ ${email.split("@")[0]} 로 로그인됨` });
    } finally {
      setLoggingIn(null);
    }
  }

  // ── 로그아웃 ─────────────────────────────────────────────────────────────
  async function handleLogout() {
    const sb = createClient();
    await sb.auth.signOut();
    setCurrentUser(null);
    notify({ type: "info", text: "로그아웃됨" });
  }

  // ── 유저 생성 ─────────────────────────────────────────────────────────────
  async function handleSetupUsers() {
    setSettingUp(true);
    try {
      const res = await fetch("/api/test/setup-users", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const created = data.users?.filter((u: { created: boolean }) => u.created).length ?? 0;
      const existing = (data.users?.length ?? 0) - created;
      notify({ type: "ok", text: `✓ 유저 ${created}명 생성, ${existing}명 기존 유지` });
    } catch (e) {
      notify({ type: "err", text: e instanceof Error ? e.message : "유저 생성 실패" });
    } finally {
      setSettingUp(false);
    }
  }

  // ── 데이터 시드 ──────────────────────────────────────────────────────────
  async function handleSeed() {
    setSeeding(true);
    setSeedPosts([]);
    try {
      const res = await fetch("/api/test/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSeedPosts(data.seeded ?? []);
      notify({ type: "ok", text: `✓ ${data.seeded?.length ?? 0}개 게시글 생성 완료` });
    } catch (e) {
      notify({ type: "err", text: e instanceof Error ? e.message : "시드 실패" });
    } finally {
      setSeeding(false);
    }
  }

  // ── 전체 설정 (유저 + 데이터) ───────────────────────────────────────────
  async function handleFullSetup() {
    setSettingUp(true);
    try {
      const usersRes = await fetch("/api/test/setup-users", { method: "POST" });
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersData.error);
      notify({ type: "info", text: "유저 생성 완료 — 데이터 생성 중..." });
    } catch (e) {
      notify({ type: "err", text: e instanceof Error ? e.message : "유저 생성 실패" });
      setSettingUp(false);
      return;
    } finally {
      setSettingUp(false);
    }
    await handleSeed();
  }

  // ── 초기화 ───────────────────────────────────────────────────────────────
  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/api/test/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSeedPosts([]);
      notify({ type: "ok", text: "✓ 테스트 데이터 삭제 완료" });
    } catch (e) {
      notify({ type: "err", text: e instanceof Error ? e.message : "초기화 실패" });
    } finally {
      setResetting(false);
    }
  }

  const isTestUser = TEST_USERS.some((u) => u.email === currentUser?.email);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12">

      {/* Dev 배너 */}
      <div className="mb-5 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-2.5 flex items-center gap-2">
        <span className="text-orange-500 text-lg">⚠️</span>
        <div>
          <p className="text-xs font-bold text-orange-700">Dev Only — 테스트 대시보드</p>
          <p className="text-[11px] text-orange-500">프로덕션에서는 모든 /test, /api/test/* 경로가 차단됩니다.</p>
        </div>
      </div>

      {/* ── 토스트 ── */}
      {toast && (
        <div className={`mb-4 rounded-xl px-4 py-2.5 text-sm font-medium border ${
          toast.type === "ok"  ? "bg-green-50 text-green-700 border-green-200" :
          toast.type === "err" ? "bg-red-50 text-red-700 border-red-200" :
                                 "bg-sky-50 text-sky-700 border-sky-200"
        }`}>
          {toast.text}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          섹션 1 — 빠른 로그인
      ══════════════════════════════════════════════════ */}
      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">빠른 로그인</h2>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              로그아웃
            </button>
          )}
        </div>

        {/* 현재 로그인 상태 */}
        {currentUser ? (
          <div className={`mb-3 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${
            isTestUser
              ? "border-indigo-200 bg-indigo-50"
              : "border-slate-200 bg-slate-50"
          }`}>
            <span className="text-lg">{isTestUser ? "✅" : "👤"}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{currentUser.nickname}</p>
              <p className="text-[11px] text-slate-400">{currentUser.email}</p>
            </div>
            <span className="ml-auto text-[11px] font-medium text-green-600">로그인 중</span>
          </div>
        ) : (
          <p className="mb-3 text-xs text-slate-400">로그인되지 않은 상태입니다.</p>
        )}

        {/* 테스트 유저 버튼들 */}
        <div className="grid grid-cols-2 gap-2">
          {TEST_USERS.map((u) => {
            const isActive = currentUser?.email === u.email;
            const isLoading = loggingIn === u.email;
            return (
              <button
                key={u.email}
                onClick={() => quickLogin(u.email)}
                disabled={isLoading || isActive}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? `${u.color} opacity-100 ring-2 ring-offset-1 ring-indigo-400`
                    : `${u.color} hover:shadow-sm`
                } disabled:cursor-not-allowed`}
              >
                <span className="text-xl shrink-0">{u.badge}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{u.nickname}</p>
                  <p className="text-[10px] opacity-70 truncate">{u.desc}</p>
                </div>
                {isActive && <span className="ml-auto text-[10px] font-bold shrink-0">✓</span>}
                {isLoading && <span className="ml-auto text-[10px] shrink-0 animate-pulse">...</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 text-center">
          비밀번호: <code className="bg-slate-100 px-1 rounded text-slate-600">{TEST_PASSWORD}</code>
          &nbsp;· 유저가 없으면 아래 설정 버튼 먼저
        </p>
      </section>

      {/* ══════════════════════════════════════════════════
          섹션 2 — 데이터 설정
      ══════════════════════════════════════════════════ */}
      <section className="mb-7">
        <h2 className="text-sm font-bold text-slate-800 mb-3">테스트 데이터</h2>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <button
            onClick={handleFullSetup}
            disabled={setting_up || seeding}
            className="col-span-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50 hover:bg-indigo-700 transition-colors"
          >
            {setting_up || seeding ? "설정 중…" : "🚀 유저 생성 + 데이터 생성"}
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 disabled:opacity-50"
          >
            {resetting ? "…" : "🗑 초기화"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSetupUsers}
            disabled={setting_up}
            className="rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-medium text-indigo-700 disabled:opacity-50"
          >
            {setting_up ? "생성 중…" : "👤 유저만 생성"}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-700 disabled:opacity-50"
          >
            {seeding ? "생성 중…" : "🌱 데이터만 생성"}
          </button>
        </div>
      </section>

      {/* ── 생성된 게시글 목록 ── */}
      {seedPosts.length > 0 && (
        <section className="mb-7">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            생성된 게시글 ({seedPosts.length}개) — 클릭해서 확인
          </h2>

          {/* Active / Closed 분리 */}
          {[
            { label: "🟢 진행중", filter: (l: string) => l.startsWith("진행중") },
            { label: "🔴 종료됨", filter: (l: string) => l.startsWith("종료") },
          ].map(({ label, filter }) => {
            const filtered = seedPosts.filter((p) => filter(p.label));
            if (!filtered.length) return null;
            return (
              <div key={label} className="mb-4">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">{label}</p>
                <div className="space-y-1.5">
                  {filtered.map((p) => (
                    <Link
                      key={p.postId}
                      href={`/post/${p.postId}`}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <span className="text-sm text-slate-700">{p.label.replace(/^(진행중|종료) · /, "")}</span>
                      <span className="text-xs text-indigo-400 shrink-0 ml-2">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <Link
            href="/"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
          >
            홈 피드에서 전체 보기 →
          </Link>
        </section>
      )}

      <hr className="border-slate-100 mb-7" />

      {/* ══════════════════════════════════════════════════
          섹션 3 — 페이지 체크리스트
      ══════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-sm font-bold text-slate-800 mb-3">페이지 체크리스트</h2>
        <div className="space-y-1.5">
          {PAGE_TESTS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-indigo-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{t.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </div>
              <span className="text-slate-300 mt-0.5 shrink-0">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 시나리오 가이드 ── */}
      <section className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">시나리오 설명</p>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li>🟢 <strong>진행중·일반</strong> — 블라인드, 투표 버튼, 낙관적 업데이트</li>
          <li>🔴 <strong>진행중·긴급</strong> — 1.5h 남음, 빨간 카운트다운 urgent 모드</li>
          <li>🖼 <strong>이미지 포함</strong> — next/image 렌더링, 본문+이미지 레이아웃</li>
          <li>🏆 <strong>종료·결과</strong> — ResultBar 애니메이션, 솔로몬의 선택 앰버 배너</li>
          <li>⚖️ <strong>종료·동점</strong> — 50:50, option_order 낮은 쪽이 솔로몬의 선택</li>
          <li>👤 <strong>다른 유저로 전환</strong> — 투표 후 다른 계정 로그인 → 피드 반응 확인</li>
        </ul>
      </section>
    </div>
  );
}
