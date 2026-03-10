import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SQL Mart Builder — Toss Bank",
  description: "YAML 설정으로 분석용 SQL 마트를 자동 생성하는 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
