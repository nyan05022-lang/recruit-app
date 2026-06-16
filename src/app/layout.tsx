import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecruitMatch — AIで最適な出会いを",
  description: "AIが就活生と企業をマッチングする逆スカウトプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
