import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "당비서 - 24시간 함께하는 당뇨 관리 비서",
  description: "늘 여러분의 곁에서 24시간 여러분을 지키는 당비서. AI 식단 사진 분석, 혈당 기록, 인슐린 관리, 검사 결과 분석까지 한 번에.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://dangbiseos.vercel.app"),
  openGraph: {
    title: "당비서 - 24시간 함께하는 당뇨 관리 비서",
    description: "늘 여러분의 곁에서 24시간 여러분을 지키는 당비서. AI 식단 분석, 혈당 기록, 인슐린 관리까지 한 번에.",
    siteName: "당비서",
    locale: "ko_KR",
    type: "website",
    url: "https://dangbiseos.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "당비서 - 24시간 함께하는 당뇨 관리 비서",
    description: "늘 여러분의 곁에서 24시간 여러분을 지키는 당비서. AI 식단 분석, 혈당 기록, 인슐린 관리까지 한 번에.",
  },
  keywords: ["당뇨", "혈당", "인슐린", "당뇨관리", "식단분석", "AI", "당비서", "건강관리", "1형당뇨", "2형당뇨"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "당비서",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/api/icon?size=180" />
      </head>
      <body
        className={`${notoSansKR.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
