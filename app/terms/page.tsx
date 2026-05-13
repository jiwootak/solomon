import Link from "next/link";

export const metadata = {
  title: "이용약관 — 모두의 솔로몬",
};

export default function TermsPage() {
  return (
    <main className="container-mobile py-8 pb-24">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← 홈으로
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">이용약관</h1>

      <div className="space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 font-semibold text-slate-900">제1조 (목적)</h2>
          <p>
            본 약관은 모두의 솔로몬(이하 &ldquo;서비스&rdquo;)이 제공하는 24시간 블라인드 투표 커뮤니티 서비스의 이용에 관한 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">제2조 (서비스 이용)</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>서비스 이용을 위해 회원가입이 필요합니다.</li>
            <li>만 14세 이상만 가입할 수 있습니다.</li>
            <li>1인 1계정 원칙을 준수해야 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">제3조 (금지 행위)</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>타인을 비방하거나 명예를 훼손하는 콘텐츠 게시</li>
            <li>개인정보(전화번호, 주소, 이메일 등) 노출</li>
            <li>음란·폭력적 콘텐츠 게시</li>
            <li>허위 정보 또는 스팸성 게시글 작성</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">제4조 (투표 규칙)</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>게시글당 1인 1회 투표만 허용됩니다.</li>
            <li>투표 결과는 24시간 종료 후에만 공개됩니다.</li>
            <li>일단 제출한 투표는 변경 또는 취소할 수 없습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">제5조 (서비스 변경 및 중단)</h2>
          <p>
            서비스 운영상 상당한 이유가 있는 경우, 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다. 중요한 변경 사항은 서비스 내 공지를 통해 사전에 안내합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">제6조 (면책)</h2>
          <p>
            서비스는 이용자가 게시한 콘텐츠에 대한 책임을 지지 않습니다. 이용자 간 발생한 분쟁에 대해서도 책임을 지지 않습니다.
          </p>
        </section>

        <p className="mt-8 text-xs text-slate-400">시행일: 2026년 5월 13일</p>
      </div>
    </main>
  );
}
