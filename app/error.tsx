"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl mb-4">😵</p>
      <h2 className="text-xl font-bold text-slate-800 mb-2">문제가 발생했어요</h2>
      <p className="text-sm text-slate-500 mb-6">
        {error.message ?? "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
      </p>
      <button
        onClick={reset}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        다시 시도
      </button>
    </main>
  );
}
