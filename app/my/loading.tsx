export default function MyPageLoading() {
  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* 프로필 헤더 스켈레톤 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      {/* 게이지 스켈레톤 */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="w-32 h-32 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-6 w-28 rounded-full bg-slate-200 animate-pulse" />
      </div>
      {/* 통계 스켈레톤 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl bg-slate-100 p-4 animate-pulse">
            <div className="h-7 w-12 rounded bg-slate-200 mb-1" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      {/* 게시글 목록 스켈레톤 */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-100 p-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-slate-200 mb-2" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </main>
  );
}
