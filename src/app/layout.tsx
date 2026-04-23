import type { Metadata } from "next";
import "./globals.css";

const title = "정민나니 스케줄";
const description = "함께 쓰는 공유 일정과 할 일 관리 앱";

export const metadata: Metadata = {
  metadataBase: new URL("https://checker-jm.vercel.app"),
  applicationName: title,
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  openGraph: {
    title,
    description,
    url: "https://checker-jm.vercel.app",
    siteName: title,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
