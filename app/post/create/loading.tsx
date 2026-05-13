/**
 * /post/create 라우트 전환 시 표시되는 스켈레톤.
 * Next.js App Router 가 자동으로 React Suspense fallback 으로 렌더.
 */
export default function PostCreateLoading() {
  return (
    <div className="container-mobile animate-pulse py-4" aria-busy>
      {/* 헤더 자리 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-9 w-9 rounded-full bg-slate-200" />
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-9 w-9" />
      </div>

      {/* 본문 카드 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </div>
      </div>

      {/* 선택지 카드 */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-6 w-12 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-200" />
            <div className="h-9 flex-1 rounded-xl bg-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-200" />
            <div className="h-9 flex-1 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>

      {/* 이미지 카드 */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
        <div className="h-9 w-full rounded-xl bg-slate-200" />
      </div>

      {/* 버튼 자리 */}
      <div className="mt-5 h-12 rounded-2xl bg-slate-200" />
    </div>
  );
}
