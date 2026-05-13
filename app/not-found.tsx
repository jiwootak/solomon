import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl mb-4">🤔</p>
      <h2 className="text-xl font-bold text-slate-800 mb-2">이 페이지는 어디에 있을까요?</h2>
      <p className="text-sm text-slate-500 mb-6">
        솔로몬도 찾지 못한 페이지예요. 링크가 잘못됐거나 삭제된 것 같아요.
      </p>
      <Link
        href="/"
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
