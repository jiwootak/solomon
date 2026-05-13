"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
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
  const [nickname, setNickname] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Supabase 가 설정되지 않았습니다.");
      return;
    }
    if (nickname.trim().length < 2) {
      setError("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    if (!agreed) {
      setError("이용약관 및 개인정보처리방침에 동의해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname: nickname.trim() },
          emailRedirectTo: `${origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "회원가입에 실패했어요.";
      setError(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-10 text-center">
        <p className="text-4xl">📬</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          회원가입 신청 완료!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {email} 으로 인증 메일을 보냈어요.<br />
          이메일 인증 확인 후 로그인하세요.
        </p>
        <Link
          href="/login"
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          로그인 페이지로
        </Link>
      </div>
    );
  }

  return (
    <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-10">
      <header className="mb-8 text-center">
        <p className="text-3xl">⚖️</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">회원가입</h1>
        <p className="mt-1 text-sm text-slate-500">
          모두의 솔로몬에 합류해보세요.
        </p>
      </header>

      {!supabaseConfigured ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Supabase 가 설정되지 않았습니다.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            닉네임
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={!supabaseConfigured}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            placeholder="2~20자"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            이메일
          </label>
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
          <label className="mb-1 block text-xs font-medium text-slate-700">
            비밀번호
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!supabaseConfigured}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            placeholder="6자 이상"
          />
        </div>

        {/* 약관 동의 */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          <span className="text-xs text-slate-600">
            <Link href="/terms" target="_blank" className="font-semibold text-indigo-600 hover:underline">이용약관</Link>
            {" "}및{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-indigo-600 hover:underline">개인정보처리방침</Link>
            에 동의합니다.
          </span>
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!supabaseConfigured || loading || !agreed}
          className={cn(
            "w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors",
            "hover:bg-indigo-700 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          로그인
        </Link>
      </p>
    </div>
  );
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("user already registered")) return "이미 가입된 이메일입니다.";
  if (m.includes("password should be")) return "비밀번호 형식이 올바르지 않습니다.";
  if (m.includes("invalid email")) return "이메일 형식이 올바르지 않습니다.";
  return message;
}
