import localFont from "next/font/local";
import type { Metadata } from "next";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";

const maruBuri = localFont({
  src: "./fonts/MaruBuri-Regular.ttf",
  variable: "--font-maruburi",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const appTitle = "정민나니 스케줄";
const browserTitle = "공유 일정 관리";
const description = "함께 쓰는 공유 일정과 할 일 관리 앱";

export const metadata: Metadata = {
  metadataBase: new URL("https://checker-jm.vercel.app"),
  applicationName: appTitle,
  title: {
    default: browserTitle,
    template: `%s | ${browserTitle}`,
  },
  description,
  openGraph: {
    title: appTitle,
    description,
    url: "https://checker-jm.vercel.app",
    siteName: appTitle,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={maruBuri.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
