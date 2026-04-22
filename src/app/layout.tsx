import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Schedule",
  description: "Firebase anonymous shared schedule manager",
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
