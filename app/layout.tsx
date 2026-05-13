import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://solomon.vercel.app",
  ),
  title: {
    default: "모두의 솔로몬",
    template: "%s | 모두의 솔로몬",
  },
  description: "일상의 갈등과 딜레마를 24시간 블라인드 투표로 해결하는 커뮤니티",
  manifest: "/manifest.json",
  applicationName: "모두의 솔로몬",
  openGraph: {
    type: "website",
    siteName: "모두의 솔로몬",
    title: "모두의 솔로몬 ⚖️",
    description: "일상의 갈등과 딜레마를 24시간 블라인드 투표로 해결하는 커뮤니티",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "모두의 솔로몬 ⚖️",
    description: "일상의 갈등과 딜레마를 24시간 블라인드 투표로 해결하는 커뮤니티",
  },
  appleWebApp: {
    capable: true,
    title: "모두의 솔로몬",
    statusBarStyle: "default",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {/* 메인 컨텐츠 영역 — 하단 네비게이션 만큼 padding 은 globals.css 에서 예약 */}
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>

        {/* 하단 네비게이션 (전역) */}
        <BottomNav />

        {/* Toast 알림 */}
        <Toaster position="top-center" richColors />

      </body>
    </html>
  );
}
