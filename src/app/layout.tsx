import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";

const nanumBarunGothic = localFont({
  src: "./fonts/NanumBarunGothicLight.otf",
  variable: "--font-nanum-barun-gothic",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const appTitle = "정민나니 스케줄";
const browserTitle = "공유 일정 관리";
const description = "초대 코드로 함께 쓰는, 우리만의 스마트 공유 일정";
const ogImage = "/og-image.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://checker-jm.vercel.app"),
  applicationName: appTitle,
  title: {
    default: browserTitle,
    template: `%s | ${browserTitle}`,
  },
  description,
  openGraph: {
    title: browserTitle,
    description,
    url: "https://checker-jm.vercel.app",
    siteName: appTitle,
    images: [
      {
        url: ogImage,
        width: 1792,
        height: 1024,
        alt: "공유 일정 관리 미리보기",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: browserTitle,
    description,
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={nanumBarunGothic.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
