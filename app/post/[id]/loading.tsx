export default function PostDetailLoading() {
  return (
    <div className="container-mobile animate-pulse py-4" aria-busy aria-label="게시글 로딩 중">
      {/* 헤더 */}
      <div className="mb-4 h-9 w-24 rounded-full bg-slate-200" />

      {/* 본문 카드 */}
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
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </div>
      </div>

      {/* 카운트다운 */}
      <div className="mt-4 h-12 rounded-2xl bg-slate-200" />

      {/* 선택지 */}
      <div className="mt-5 space-y-2.5">
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
