import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=s==='dark'||((s===null||s==='system')&&m);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "snapfeed",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans dark:bg-neutral-950 dark:text-neutral-100 [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-40 flex justify-end border-b border-gray-200/60 bg-white/80 px-3 py-1.5 backdrop-blur dark:border-neutral-800/60 dark:bg-neutral-950/80 [padding-top:calc(env(safe-area-inset-top)+0.375rem)]">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
