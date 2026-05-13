"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <main className="container-mobile py-8 pb-24">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        ← 뒤로가기
      </button>

      <h1 className="mb-2 text-2xl font-bold text-slate-900">이용약관</h1>
      <p className="mb-8 text-xs text-slate-400">시행일: 2026년 5월 13일 · 최종 개정: 2026년 5월 13일</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700">

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제1조 (목적)</h2>
          <p>
            본 약관은 지우탁(이하 &ldquo;운영자&rdquo;)이 운영하는 &ldquo;모두의 솔로몬&rdquo;(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 운영자와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제2조 (용어 정의)</h2>
          <p className="mb-2">본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li><strong>서비스</strong>: 운영자가 제공하는 24시간 블라인드 투표 커뮤니티 플랫폼 및 관련 제반 서비스</li>
            <li><strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원</li>
            <li><strong>회원</strong>: 서비스에 이메일 또는 소셜 계정으로 가입하여 서비스를 이용하는 자</li>
            <li><strong>게시글</strong>: 회원이 서비스 내에 투표 주제로 등록하는 딜레마·갈등 상황 및 선택지</li>
            <li><strong>블라인드 투표</strong>: 게시글 등록 후 24시간 동안 투표 현황이 공개되지 않는 투표 방식</li>
            <li><strong>솔로몬 지수</strong>: 이용자가 참여한 투표 중 최다 득표 선택지를 선택한 비율을 나타내는 지표</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>운영자는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
            <li>약관을 변경할 경우 적용 예정일 7일 전부터 서비스 내 공지사항을 통해 공지합니다. 다만, 이용자에게 불리한 변경의 경우 30일 전부터 공지합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다. 변경 공지 후 계속 서비스를 이용하면 변경 약관에 동의한 것으로 간주합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제4조 (회원가입)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>이용자는 운영자가 정한 가입 양식에 따라 정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.</li>
            <li>회원가입은 만 14세 이상인 자에 한하여 가능합니다. 만 14세 미만 아동의 가입은 허용되지 않습니다.</li>
            <li>1인 1계정 원칙을 준수해야 하며, 다수의 계정을 생성하여 서비스를 이용하는 행위는 금지됩니다.</li>
            <li>회원은 가입 시 제공한 정보가 정확하고 최신 상태임을 보장해야 합니다. 허위 정보 제공으로 인해 발생하는 모든 불이익에 대해 운영자는 책임을 지지 않습니다.</li>
            <li>운영자는 다음 각 호에 해당하는 경우 회원가입 신청을 승낙하지 않을 수 있습니다.
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>가입 신청자가 본 약관에 의해 이전에 회원 자격을 상실한 적이 있는 경우</li>
                <li>허위 정보를 기재하거나 운영자가 요청하는 정보를 제공하지 않은 경우</li>
                <li>기타 운영자가 정한 이용 신청 요건을 충족하지 못하는 경우</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제5조 (회원 탈퇴 및 자격 상실)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>회원은 언제든지 서비스 내 &ldquo;내 프로필&rdquo; 메뉴를 통해 탈퇴를 요청할 수 있으며, 운영자는 즉시 처리합니다.</li>
            <li>탈퇴 시 해당 회원의 개인정보는 개인정보처리방침에 따라 처리됩니다. 단, 회원이 작성한 게시글 및 투표 데이터는 서비스의 통계적 무결성 유지를 위해 익명화된 형태로 보존될 수 있습니다.</li>
            <li>회원이 다음 각 호에 해당하는 경우 운영자는 사전 통보 없이 회원 자격을 제한하거나 정지, 상실시킬 수 있습니다.
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>타인의 정보를 도용하여 가입한 경우</li>
                <li>제7조(금지 행위)에 해당하는 행위를 한 경우</li>
                <li>서비스의 정상적인 운영을 방해한 경우</li>
                <li>관련 법령 또는 본 약관을 위반한 경우</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제6조 (서비스 이용)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 연중무휴 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검·교체·고장 등 기술적 사유로 일시 중단될 수 있습니다.</li>
            <li>운영자는 서비스 이용에 관한 세부 사항을 공지사항 또는 서비스 내 안내를 통해 고지할 수 있습니다.</li>
            <li>서비스의 일부 기능은 회원가입 후 로그인한 상태에서만 이용 가능합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제7조 (금지 행위)</h2>
          <p className="mb-2">이용자는 다음 각 호에 해당하는 행위를 해서는 안 됩니다.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>타인의 개인정보(이름, 전화번호, 주소, 이메일 등)를 게시하거나 유출하는 행위</li>
            <li>타인을 비방·모욕하거나 명예를 훼손하는 콘텐츠를 게시하는 행위</li>
            <li>음란·폭력적·혐오적 콘텐츠를 게시하거나 링크하는 행위</li>
            <li>허위 사실을 유포하거나 스팸성 게시글을 반복 작성하는 행위</li>
            <li>동일하거나 유사한 주제의 게시글을 반복적으로 도배하는 행위</li>
            <li>정치적 목적의 조직적 투표 조작 행위</li>
            <li>서비스의 소프트웨어를 역설계, 복제, 변형하는 행위</li>
            <li>자동화된 수단(봇, 스크립트 등)을 이용하여 서비스를 이용하는 행위</li>
            <li>운영자의 사전 서면 동의 없이 서비스를 상업적 목적으로 이용하는 행위</li>
            <li>기타 관련 법령 또는 선량한 풍속 기타 사회질서에 위반되는 행위</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제8조 (투표 규칙)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>투표는 게시글당 1인 1회만 참여 가능합니다.</li>
            <li>투표 결과(득표 수, 비율)는 게시글 등록 후 24시간이 경과한 이후에만 공개됩니다.</li>
            <li>일단 제출된 투표는 변경 또는 취소가 불가능합니다.</li>
            <li>게시글이 만료(24시간 경과)된 후에는 투표에 참여할 수 없습니다.</li>
            <li>본인이 작성한 게시글에는 투표할 수 없습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제9조 (게시물 관리)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>회원이 서비스 내에 게시한 게시물의 저작권은 해당 회원에게 귀속됩니다.</li>
            <li>회원은 게시물을 등록함으로써 운영자에게 해당 게시물을 서비스 내에서 비상업적 목적으로 사용할 수 있는 비독점적·무상의 권리를 부여합니다.</li>
            <li>운영자는 다음 각 호에 해당하는 게시물을 사전 통보 없이 삭제하거나 노출을 제한할 수 있습니다.
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>제7조(금지 행위)에 위반되는 내용을 포함한 게시물</li>
                <li>타인으로부터 신고가 접수된 게시물 (검토 후 조치)</li>
                <li>관련 법령에 위반되는 게시물</li>
              </ul>
            </li>
            <li>회원은 본인이 작성한 게시글이 투표 진행 중인 경우, 공정한 투표 진행을 위해 삭제가 제한될 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제10조 (서비스 변경 및 중단)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>운영자는 서비스의 내용·형태를 변경하거나 중단할 수 있습니다. 중요한 변경은 서비스 내 공지를 통해 사전에 안내합니다.</li>
            <li>천재지변, 불가항력적 사유, 시스템 장애 등 운영자의 귀책사유가 없는 경우 서비스 중단에 대한 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제11조 (면책)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>운영자는 이용자가 게시한 콘텐츠의 정확성·신뢰성·적법성에 대해 책임을 지지 않습니다.</li>
            <li>운영자는 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.</li>
            <li>운영자는 서비스의 이용과 관련하여 이용자에게 발생한 손해에 대해 운영자의 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
            <li>솔로몬 지수는 엔터테인먼트 목적의 지표이며, 법적·사회적 결정의 근거로 사용할 수 없습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제12조 (분쟁 해결)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 운영자와 이용자는 분쟁 해결을 위해 성실히 협의합니다.</li>
            <li>협의가 이루어지지 않을 경우, 관련 법령에 따른 분쟁조정기관에 조정을 신청하거나 민사소송법상의 관할 법원에 소송을 제기할 수 있습니다.</li>
            <li>본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련된 소송의 관할 법원은 민사소송법에 따릅니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900">제13조 (운영자 정보)</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">서비스명</td>
                <td className="py-2 text-slate-700">모두의 솔로몬</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">운영자</td>
                <td className="py-2 text-slate-700">지우탁</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">문의 이메일</td>
                <td className="py-2 text-slate-700">jwootak0403@gmail.com</td>
              </tr>
            </tbody>
          </table>
        </section>

        <p className="mt-8 text-xs text-slate-400">본 약관은 2026년 5월 13일부터 시행됩니다.</p>
      </div>
    </main>
  );
}
