"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-10 text-center">
        <p className="text-4xl">📬</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">이메일을 확인하세요</h1>
        <p className="mt-2 text-sm text-slate-600">
          {email} 으로 비밀번호 재설정 링크를 보냈어요.
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
        <p className="text-3xl">🔑</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">비밀번호 찾기</h1>
        <p className="mt-1 text-sm text-slate-500">
          가입한 이메일로 재설정 링크를 보내드립니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">이메일</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="you@example.com"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors",
            "hover:bg-indigo-700 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? "전송 중..." : "재설정 링크 보내기"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
