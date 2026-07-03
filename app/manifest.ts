import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest. Store packaging (Play TWA / iOS wrapper)
// reads this file — keep id/scope/start_url stable once published.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "snapfeed — 수기 수유 기록 디지털화",
    short_name: "snapfeed",
    description:
      "어르신·산후도우미가 수첩에 손으로 적은 수유 기록을 사진 한 장으로 디지털화하고 패턴을 확인합니다.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#fdfbf5",
    theme_color: "#fbbf24",
    lang: "ko",
    dir: "ltr",
    categories: ["lifestyle", "productivity", "medical"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/screenshot-narrow.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "수첩 사진 한 장으로 수유 기록을 디지털화",
      },
      {
        src: "/screenshot-wide.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "snapfeed 홈 화면",
      },
    ],
    shortcuts: [
      {
        name: "사진 업로드",
        short_name: "업로드",
        description: "수유 기록 수첩 사진을 올려 디지털화",
        url: "/upload",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "기록 보기",
        short_name: "기록",
        description: "지금까지 저장된 수유·배변 기록",
        url: "/records",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "패턴 분석",
        short_name: "패턴",
        description: "일·주 단위 수유 패턴 그래프",
        url: "/stats",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
