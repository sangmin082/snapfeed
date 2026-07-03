import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "snapfeed가 수집·이용하는 개인정보와 그 처리 방침을 안내합니다.",
};

const EFFECTIVE_DATE = "2026년 7월 1일";
const CONTACT_EMAIL = "sangmin082@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-rose-700 underline-offset-4 hover:underline dark:text-rose-400"
      >
        ← snapfeed 홈으로
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
        개인정보처리방침
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">시행일: {EFFECTIVE_DATE}</p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
        <p>
          snapfeed(이하 “서비스”)는 이용자가 수기로 작성한 아기 수유·돌봄 기록을 사진 한 장으로 디지털화하는
          서비스입니다. 서비스는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을
          준수합니다. 본 방침은 서비스가 어떤 정보를 수집하고 어떻게 이용·보관·파기하는지를 설명합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <p>서비스는 아래 정보를 수집합니다.</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>계정 정보</strong>: 이메일 주소, 비밀번호(암호화 저장). Google 계정으로 가입·로그인하는
              경우 Google이 제공하는 이메일 및 계정 식별자.
            </li>
            <li>
              <strong>아이 프로필</strong>: 아이의 이름(애칭), 생년월일, 출생 몸무게·키(선택), 프로필 사진(선택),
              이용자와 아이의 관계(예: 엄마·아빠·조부모·돌봄 제공자).
            </li>
            <li>
              <strong>돌봄 기록</strong>: 수유(시간·형태·양·메모), 배설(소변·대변), 수면, 구토, 체중·체온 등
              이용자가 입력하거나 사진에서 추출된 기록.
            </li>
            <li>
              <strong>업로드 이미지</strong>: 이용자가 촬영·업로드한 수기 기록지 사진 원본.
            </li>
            <li>
              <strong>접속 정보</strong>: 서비스 남용 방지(요청 한도 관리)를 위한 IP 주소.
            </li>
          </ul>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>회원 식별 및 로그인 등 계정 관리</li>
            <li>업로드한 사진의 문자 인식(OCR) 및 돌봄 기록의 자동 구조화</li>
            <li>기록의 저장·조회와 일·주·월 단위 패턴 통계 제공</li>
            <li>가족·돌봄 제공자 간 같은 아이 기록의 공유</li>
            <li>비정상 이용 및 과도한 요청 방지(서비스 안정성 확보)</li>
          </ul>
        </Section>

        <Section title="3. 처리위탁 및 국외 이전">
          <p>
            서비스는 운영을 위해 아래 사업자에게 개인정보 처리를 위탁하며, 이들 사업자는 데이터센터를 국외(미국 등)에
            둘 수 있습니다. 위탁 범위 내에서만 정보가 처리되며, 광고 등 다른 목적으로 제공되지 않습니다.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">수탁자</th>
                  <th className="px-3 py-2 font-medium">위탁 업무</th>
                  <th className="px-3 py-2 font-medium">이전 항목</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                <tr>
                  <td className="px-3 py-2">Supabase, Inc.</td>
                  <td className="px-3 py-2">인증, 데이터베이스, 사진 저장</td>
                  <td className="px-3 py-2">계정·프로필·돌봄 기록·업로드 이미지</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Google LLC</td>
                  <td className="px-3 py-2">사진 문자 인식·구조화(Gemini API), Google 로그인</td>
                  <td className="px-3 py-2">업로드 이미지, (Google 로그인 시) 계정 식별 정보</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Cloudflare, Inc.</td>
                  <td className="px-3 py-2">애플리케이션 호스팅·전송</td>
                  <td className="px-3 py-2">서비스 이용 시 발생하는 접속 정보</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-neutral-500">
            업로드한 기록지 사진은 문자 인식을 위해 Google의 Gemini API로 전송됩니다. 이용자는 이러한 국외
            이전에 동의하지 않을 수 있으나, 이 경우 사진 자동 인식 기능을 이용할 수 없습니다.
          </p>
        </Section>

        <Section title="4. 보유 및 이용 기간">
          <p>
            개인정보는 회원 탈퇴(계정 삭제) 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라
            보존이 필요한 경우 해당 기간 동안 보관할 수 있습니다. 남용 방지를 위한 IP 기반 요청 기록은 짧은 기간
            후 자동 만료됩니다.
          </p>
        </Section>

        <Section title="5. 이용자의 권리와 행사 방법">
          <p>
            이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리정지를 요구할 수 있습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>정정</strong>: 「프로필 수정」 화면에서 아이 정보와 사진을 변경할 수 있습니다.
            </li>
            <li>
              <strong>계정·데이터 삭제</strong>: 「프로필 수정 → 계정 삭제」에서 직접 계정과 데이터를 영구 삭제할
              수 있습니다. 가족과 공유 중인 아이 기록은 다른 보호자에게 그대로 남고, 본인만 보유한 기록은 완전히
              삭제됩니다.
            </li>
          </ul>
          <p className="mt-2">
            기타 문의는 아래 연락처로 요청하실 수 있습니다.
          </p>
        </Section>

        <Section title="6. 아동의 정보에 관하여">
          <p>
            서비스의 가입·이용 주체는 아이를 돌보는 보호자(성인)입니다. 서비스에 입력되는 아이의 정보는
            보호자가 자신의 책임과 동의 하에 등록하는 것으로, 서비스는 이를 돌봄 기록 관리 목적으로만 처리합니다.
            만 14세 미만 아동이 본인의 계정을 직접 만들어 이용하는 것을 의도하지 않습니다.
          </p>
        </Section>

        <Section title="7. 개인정보의 안전성 확보 조치">
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>전송 구간 암호화(HTTPS) 적용</li>
            <li>비밀번호의 암호화 저장</li>
            <li>회원 본인 및 권한이 부여된 가족 구성원만 해당 아이의 기록에 접근하도록 접근 통제</li>
          </ul>
        </Section>

        <Section title="8. 개인정보 보호책임자 및 문의">
          <p>
            개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락해 주시기 바랍니다.
          </p>
          <p className="mt-2">
            이메일:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-700 underline-offset-4 hover:underline dark:text-rose-400">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <Section title="9. 방침의 변경">
          <p>
            본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 중요한 변경이 있는 경우 서비스 내 공지를 통해
            안내합니다.
          </p>
        </Section>

        <nav className="border-t border-gray-200 pt-6 text-sm dark:border-neutral-800">
          <Link href="/terms" className="text-rose-700 underline-offset-4 hover:underline dark:text-rose-400">
            이용약관 보기 →
          </Link>
        </nav>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-neutral-100">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
