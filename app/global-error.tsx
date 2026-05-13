"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <p className="text-6xl mb-4">💥</p>
        <h2 className="text-xl font-bold text-slate-800 mb-2">심각한 오류가 발생했어요</h2>
        <p className="text-sm text-slate-500 mb-6">앱을 다시 시작하면 해결될 수 있어요.</p>
        <button
          onClick={reset}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          앱 재시작
        </button>
      </body>
    </html>
  );
}
