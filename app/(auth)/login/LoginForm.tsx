"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";

  const supabaseConfigured = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    [],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Supabase 가 설정되지 않았습니다. .env.local 을 확인하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그인에 실패했어요.";
      setError(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!supabaseConfigured) {
      setError("Supabase 가 설정되지 않았습니다.");
      return;
    }
    setError(null);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "구글 로그인에 실패했어요.";
      setError(translateAuthError(message));
    }
  }

  return (
    <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-10">
      <header className="mb-8 text-center">
        <p className="text-3xl">⚖️</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">모두의 솔로몬</h1>
        <p className="mt-1 text-sm text-slate-500">
          24시간 블라인드 투표 커뮤니티
        </p>
      </header>

      {!supabaseConfigured ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Supabase 가 설정되지 않았습니다. 환경변수
          <code className="mx-1 rounded bg-amber-100 px-1 font-mono">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          ,
          <code className="mx-1 rounded bg-amber-100 px-1 font-mono">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          를 확인해주세요.
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={!supabaseConfigured || loading}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors",
          "hover:bg-slate-50 active:scale-[0.99]",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <GoogleIcon />
        <span>Google 로 계속하기</span>
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">또는</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">이메일</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!supabaseConfigured}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">비밀번호</label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">
              비밀번호 찾기
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!supabaseConfigured}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={!supabaseConfigured || loading}
          className={cn(
            "w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors",
            "hover:bg-indigo-700 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? "로그인 중..." : "이메일로 로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        아직 계정이 없으신가요?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
          회원가입
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.5 29.3 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.2-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.5 29.3 4.5 24 4.5 16.4 4.5 9.8 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.1 0-9.5-3.3-11.2-7.9l-6.5 5C9.7 39.1 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed")) return "이메일 인증을 먼저 완료해주세요.";
  if (m.includes("user already registered")) return "이미 가입된 이메일입니다.";
  return message;
}
