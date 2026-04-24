import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "snapfeed — 수첩에 쓴 수유 기록을 사진 한 장으로",
    template: "%s · snapfeed",
  },
  description:
    "어르신·산후도우미가 수기로 남겨주신 수유 기록을 부모가 사진 한 장으로 디지털화해 한눈에 패턴을 확인합니다.",
  applicationName: "snapfeed",
  openGraph: {
    title: "snapfeed — 수첩에 쓴 수유 기록을 사진 한 장으로",
    description:
      "어르신·산후도우미가 적어주신 수유 기록을 부모가 한 번에 디지털로 정리합니다.",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "snapfeed",
    description: "수기 수유 기록을 AI로 디지털 통합",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
