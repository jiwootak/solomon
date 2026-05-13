"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase가 URL 해시에서 세션을 복원하길 기다림
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-10 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">비밀번호가 변경되었습니다</h1>
        <p className="mt-2 text-sm text-slate-600">잠시 후 로그인 페이지로 이동합니다.</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-10 text-center">
        <p className="text-4xl">🔑</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">링크를 확인하는 중...</h1>
        <p className="mt-2 text-sm text-slate-500">
          이메일의 재설정 링크를 통해 접근해주세요.
        </p>
        <Link href="/forgot-password" className="mt-6 text-sm font-semibold text-indigo-600">
          비밀번호 찾기 다시 시도
        </Link>
      </div>
    );
  }

  return (
    <div className="container-mobile flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-10">
      <header className="mb-8 text-center">
        <p className="text-3xl">🔐</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">새 비밀번호 설정</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">새 비밀번호</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="6자 이상"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">비밀번호 확인</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="동일하게 입력"
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
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
