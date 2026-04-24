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
    default: "snapfeed — 수기 수유 기록을 사진 한 장으로",
    template: "%s · snapfeed",
  },
  description:
    "수첩에 적어둔 수유 기록을 AI가 한 번에 읽어 정리합니다. 사진만 찍으면 시간·양·종류가 자동으로 디지털화됩니다.",
  applicationName: "snapfeed",
  openGraph: {
    title: "snapfeed — 수기 수유 기록을 사진 한 장으로",
    description:
      "수첩에 적어둔 수유 기록을 AI가 한 번에 읽어 정리합니다.",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "snapfeed",
    description: "수기 수유 기록을 AI로 디지털화",
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
