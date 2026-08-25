import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "青团智能体",
  description: "面向老年人的陪伴与生活服务智能体。",
  icons: {
    icon: "/brand/qingtuan-logo.png",
    shortcut: "/brand/qingtuan-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
