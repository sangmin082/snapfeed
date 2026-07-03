import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
  description: "snapfeed 서비스 이용약관입니다.",
};

const EFFECTIVE_DATE = "2026년 7월 1일";
const CONTACT_EMAIL = "sangmin082@gmail.com";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-rose-700 underline-offset-4 hover:underline dark:text-rose-400"
      >
        ← snapfeed 홈으로
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
        이용약관
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">시행일: {EFFECTIVE_DATE}</p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
        <Section title="제1조 (목적)">
          <p>
            본 약관은 snapfeed(이하 “서비스”)를 이용함에 있어 서비스와 이용자 간의 권리·의무 및 책임사항을
            규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (정의)">
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>“이용자”란 본 약관에 따라 서비스를 이용하는 회원을 말합니다.</li>
            <li>“콘텐츠”란 이용자가 업로드한 사진과 입력·생성된 돌봄 기록을 말합니다.</li>
          </ul>
        </Section>

        <Section title="제3조 (서비스의 내용)">
          <p>
            서비스는 이용자가 업로드한 수기 기록지 사진을 인공지능으로 인식하여 수유·배설·수면 등의 기록으로
            구조화하고, 이를 저장·조회하며 기간별 패턴 통계를 제공합니다. 또한 가족·돌봄 제공자가 같은 아이의
            기록을 함께 보고 입력할 수 있도록 합니다.
          </p>
        </Section>

        <Section title="제4조 (자동 인식의 한계 및 의료적 면책)">
          <p>
            사진 자동 인식은 인공지능에 의한 추정이므로 손글씨·사진 상태에 따라 오류가 발생할 수 있습니다.
            이용자는 저장 전 인식 결과를 확인·수정할 책임이 있습니다.
          </p>
          <p className="mt-2 font-medium text-gray-900 dark:text-neutral-100">
            서비스는 의료기기나 의료 서비스가 아니며, 제공되는 기록·통계는 진단·치료 등 의학적 판단의 근거로
            사용될 수 없습니다. 아이의 건강에 관한 사항은 반드시 의료 전문가와 상담하시기 바랍니다.
          </p>
        </Section>

        <Section title="제5조 (회원가입 및 계정)">
          <p>
            이용자는 이메일 또는 Google 계정으로 가입할 수 있으며, 본인의 계정 정보를 정확히 유지하고 안전하게
            관리할 책임이 있습니다. 타인의 정보를 도용하여 가입할 수 없습니다.
          </p>
        </Section>

        <Section title="제6조 (이용자의 의무)">
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>본인 또는 정당한 권한이 있는 아이의 기록만 업로드·입력해야 합니다.</li>
            <li>타인의 권리를 침해하거나 법령에 위반되는 콘텐츠를 업로드해서는 안 됩니다.</li>
            <li>서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          </ul>
        </Section>

        <Section title="제7조 (콘텐츠의 권리)">
          <p>
            이용자가 업로드·생성한 콘텐츠에 대한 권리는 이용자에게 있습니다. 서비스는 제3조의 기능 제공을 위한
            범위(저장·인식·통계 표시 등) 내에서만 콘텐츠를 처리하며, 자세한 처리 내용은{" "}
            <Link href="/privacy" className="text-rose-700 underline-offset-4 hover:underline dark:text-rose-400">
              개인정보처리방침
            </Link>
            을 따릅니다.
          </p>
        </Section>

        <Section title="제8조 (서비스의 변경·중단)">
          <p>
            서비스는 현재 시험 운영(MVP) 단계로, 기능이 변경되거나 일시적·영구적으로 중단될 수 있습니다.
            운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다.
          </p>
        </Section>

        <Section title="제9조 (계약 해지 및 데이터 삭제)">
          <p>
            이용자는 언제든지 「프로필 수정 → 계정 삭제」를 통해 계정과 데이터를 영구 삭제하고 이용계약을 해지할
            수 있습니다. 가족과 공유 중인 아이 기록은 다른 보호자에게 그대로 남을 수 있습니다.
          </p>
        </Section>

        <Section title="제10조 (책임의 제한)">
          <p>
            서비스는 현재 무료로 “있는 그대로” 제공되며, 관련 법령이 허용하는 범위에서 자동 인식의 정확성,
            서비스의 연속성 또는 데이터의 무결성을 보증하지 않습니다. 이용자는 중요한 기록을 별도로 보관할 것을
            권장합니다.
          </p>
        </Section>

        <Section title="제11조 (준거법 및 관할)">
          <p>
            본 약관은 대한민국 법령에 따라 해석되며, 서비스와 이용자 간 분쟁에 대하여는 관계 법령에 정한 절차에
            따른 법원을 관할 법원으로 합니다.
          </p>
        </Section>

        <Section title="문의">
          <p>
            약관에 관한 문의:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-700 underline-offset-4 hover:underline dark:text-rose-400">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <p className="text-xs text-gray-500 dark:text-neutral-500">부칙: 본 약관은 {EFFECTIVE_DATE}부터 시행합니다.</p>

        <nav className="border-t border-gray-200 pt-6 text-sm dark:border-neutral-800">
          <Link href="/privacy" className="text-rose-700 underline-offset-4 hover:underline dark:text-rose-400">
            개인정보처리방침 보기 →
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
