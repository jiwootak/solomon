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

      <h1 className="mb-2 text-2xl font-bold text-slate-900">개인정보처리방침</h1>
      <p className="mb-8 text-xs text-slate-400">시행일: 2026년 5월 13일 · 최종 개정: 2026년 5월 13일</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700">

        <p>
          지우탁(이하 &ldquo;운영자&rdquo;)은 &ldquo;모두의 솔로몬&rdquo;(이하 &ldquo;서비스&rdquo;) 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수합니다. 본 방침은 서비스 이용과 관련하여 수집되는 개인정보의 처리에 관한 사항을 안내합니다.
        </p>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제1조 (개인정보의 처리 목적)</h2>
          <p className="mb-2">운영자는 다음의 목적으로 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 목적이 변경될 경우 별도의 동의를 받겠습니다.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li><strong>회원 관리</strong>: 회원 식별, 본인 확인, 서비스 부정 이용 방지</li>
            <li><strong>서비스 제공</strong>: 게시글 작성·투표 참여·솔로몬 지수 산출 등 서비스 핵심 기능 제공</li>
            <li><strong>서비스 개선</strong>: 이용 통계 분석, 신규 기능 개발, 서비스 품질 향상</li>
            <li><strong>고객 지원</strong>: 문의·불편사항 접수 및 처리, 공지사항 전달</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제2조 (처리하는 개인정보 항목)</h2>

          <div className="mb-4">
            <h3 className="mb-2 font-semibold text-slate-800">① 이메일 회원가입 시</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>필수</strong>: 이메일 주소, 비밀번호(암호화 저장), 닉네임</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 font-semibold text-slate-800">② Google 소셜 로그인 시</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>필수</strong>: Google 계정 이메일 주소, Google 제공 고유 식별자</li>
              <li><strong>선택</strong>: 프로필 사진(Google 계정에 등록된 경우)</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 font-semibold text-slate-800">③ 서비스 이용 과정에서 자동 생성·수집되는 정보</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>접속 IP 주소, 서비스 이용 기록(접속 시각, 게시글·투표 활동 기록)</li>
              <li>기기 정보(브라우저 종류, OS 버전)</li>
              <li>쿠키 및 세션 토큰</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제3조 (개인정보의 처리 및 보유 기간)</h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <strong>회원 정보</strong>: 회원 탈퇴 시까지 보유합니다. 탈퇴 요청 즉시 지체 없이 파기합니다.
            </li>
            <li>
              <strong>법령에 의한 보존</strong>: 관련 법령에 따라 일정 기간 보관이 의무화된 경우 해당 기간 동안 보관합니다.
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>서비스 이용 기록, 접속 로그: 3개월 (통신비밀보호법)</li>
                <li>소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
              </ul>
            </li>
            <li>
              <strong>익명 처리된 통계 데이터</strong>: 탈퇴 이후에도 개인을 식별할 수 없는 형태로 가공된 투표 통계는 서비스 운영 목적으로 보존될 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제4조 (개인정보의 제3자 제공)</h2>
          <p>
            운영자는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제5조 (개인정보 처리 업무 위탁)</h2>
          <p className="mb-3">운영자는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="py-2 pr-4 text-left font-semibold text-slate-900">수탁업체</th>
                  <th className="py-2 pr-4 text-left font-semibold text-slate-900">위탁 업무</th>
                  <th className="py-2 text-left font-semibold text-slate-900">보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 pr-4 font-medium">Supabase Inc.</td>
                  <td className="py-2 pr-4">데이터베이스 저장, 회원 인증 및 소셜 로그인 처리</td>
                  <td className="py-2">위탁 계약 종료 시까지</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 pr-4 font-medium">Vercel Inc.</td>
                  <td className="py-2 pr-4">서비스 호스팅, 요청 처리</td>
                  <td className="py-2">위탁 계약 종료 시까지</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Google LLC</td>
                  <td className="py-2 pr-4">소셜 로그인(OAuth 2.0) 연동</td>
                  <td className="py-2">Google 계정 연동 해제 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            각 수탁업체는 자체적인 개인정보보호 정책을 보유합니다. 상세 내용은 각 업체의 개인정보처리방침을 참조하세요.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제6조 (정보주체의 권리·의무 및 행사 방법)</h2>
          <p className="mb-2">이용자(정보주체)는 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li><strong>개인정보 열람 요청</strong>: 본인의 개인정보 처리 현황 및 내용 확인</li>
            <li><strong>정정·삭제 요청</strong>: 잘못된 개인정보의 수정 또는 삭제 요청</li>
            <li><strong>처리 정지 요청</strong>: 개인정보 처리의 일시적 중지 요청</li>
            <li><strong>동의 철회</strong>: 서비스 탈퇴를 통한 수집·이용 동의 철회</li>
          </ol>
          <p className="mt-3">
            위 권리 행사는 서비스 내 &ldquo;내 프로필&rdquo; 메뉴 또는 아래 개인정보 보호책임자에게 이메일로 요청하시면 지체 없이 처리하겠습니다.
          </p>
          <p className="mt-2">
            만 14세 미만 아동의 경우 법정대리인이 권리를 행사할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제7조 (개인정보의 파기)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>운영자는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 해당 개인정보를 파기합니다.</li>
            <li><strong>파기 절차</strong>: 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.</li>
            <li><strong>파기 방법</strong>: 전자적 파일 형태의 정보는 복원이 불가능한 방법으로 영구 삭제하며, 기록·출력물 등은 분쇄하거나 소각합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제8조 (개인정보의 안전성 확보 조치)</h2>
          <p className="mb-2">운영자는 개인정보의 안전성 확보를 위해 다음의 조치를 취하고 있습니다.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>비밀번호 암호화</strong>: 비밀번호는 bcrypt 알고리즘으로 단방향 암호화하여 저장합니다.</li>
            <li><strong>통신 암호화</strong>: HTTPS(TLS) 프로토콜을 적용하여 전송 중 데이터를 암호화합니다.</li>
            <li><strong>접근 제한</strong>: Row Level Security(RLS) 정책을 통해 이용자별 데이터 접근 권한을 엄격히 통제합니다.</li>
            <li><strong>최소 권한 원칙</strong>: 서비스 운영에 필요한 최소한의 개인정보만 수집·처리합니다.</li>
            <li><strong>세션 관리</strong>: JWT 기반 세션 토큰을 사용하며, 만료 기간을 설정하여 보안을 강화합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제9조 (쿠키 운영)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 로그인 세션 유지 목적으로 쿠키를 사용합니다.</li>
            <li>이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키를 거부하면 로그인이 필요한 서비스 이용이 제한됩니다.</li>
            <li>쿠키 설정 방법: 브라우저 설정 → 개인정보 보호 → 쿠키 및 사이트 데이터 관리</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제10조 (개인정보 보호책임자)</h2>
          <p className="mb-3">
            운영자는 개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제 등을 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">성명</td>
                <td className="py-2 text-slate-700">지우탁</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">이메일</td>
                <td className="py-2 text-slate-700">jwootak0403@gmail.com</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3">
            이용자는 서비스 이용 중 발생한 모든 개인정보 보호 관련 문의를 위 이메일로 접수하실 수 있습니다. 운영자는 접수 후 5영업일 이내에 답변합니다.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            개인정보 침해 관련 신고·상담은 아래 기관에도 문의하실 수 있습니다.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-500">
            <li>개인정보보호위원회 (www.pipc.go.kr / 국번 없이 182)</li>
            <li>개인정보 침해신고센터 (privacy.kisa.or.kr / 국번 없이 118)</li>
            <li>대검찰청 사이버범죄수사단 (www.spo.go.kr / 02-3480-3573)</li>
            <li>경찰청 사이버범죄신고시스템 (ecrm.cyber.go.kr / 국번 없이 182)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제11조 (개인정보처리방침의 변경)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>본 방침은 시행일로부터 적용되며, 법령 및 방침 변경에 따라 내용이 추가·수정·삭제될 수 있습니다.</li>
            <li>방침이 변경되는 경우 변경 사항을 서비스 내 공지사항을 통해 시행 7일 전부터 공지합니다. 다만, 이용자의 권리에 중요한 변경이 발생하는 경우 30일 전에 공지합니다.</li>
          </ol>
        </section>

        <p className="mt-8 text-xs text-slate-400">본 방침은 2026년 5월 13일부터 시행됩니다.</p>
      </div>
    </main>
  );
}
