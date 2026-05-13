import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 — 모두의 솔로몬",
};

export default function PrivacyPage() {
  return (
    <main className="container-mobile py-8 pb-24">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← 홈으로
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">개인정보처리방침</h1>

      <div className="space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 font-semibold text-slate-900">1. 수집하는 개인정보</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>이메일 주소 (회원가입 및 인증 목적)</li>
            <li>닉네임 (서비스 이용 식별)</li>
            <li>투표 및 게시글 데이터 (서비스 제공)</li>
            <li>접속 IP, 브라우저 정보 (보안 및 서비스 운영)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">2. 개인정보 수집 목적</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>회원 식별 및 서비스 이용</li>
            <li>솔로몬 지수 계산 및 통계</li>
            <li>부정 이용 방지</li>
            <li>서비스 개선을 위한 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">3. 개인정보 보유 기간</h2>
          <p>
            회원 탈퇴 시까지 보유합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">4. 개인정보 제3자 제공</h2>
          <p>
            이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 경우는 예외입니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">5. 개인정보 처리 위탁</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>Supabase Inc. — 데이터베이스 및 인증 서비스</li>
            <li>Vercel Inc. — 서비스 호스팅</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보를 조회·수정하거나 회원 탈퇴를 통해 삭제를 요청할 수 있습니다. 개인정보 관련 문의는 서비스 내 이메일로 연락해 주세요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900">7. 쿠키 사용</h2>
          <p>
            서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 비활성화할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>

        <p className="mt-8 text-xs text-slate-400">시행일: 2026년 5월 13일</p>
      </div>
    </main>
  );
}
