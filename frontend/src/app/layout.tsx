'use client';

import type { Metadata } from "next";
import { Inter, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import GlobalHandler from "@/components/GlobalHandler";
import { ConfigProvider } from 'antd';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const maShanZheng = Ma_Shan_Zheng({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ma-shan-zheng",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="zh">
      <head>
        <title>斩词阁</title>
        <meta name="description" content="一个优雅的单词学习平台" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${maShanZheng.variable} min-h-screen`}>
        <GlobalHandler />
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#bfa76a',
              colorPrimaryHover: '#4b3a1e',
              colorPrimaryActive: '#4b3a1e',
            },
            components: {
              Tag: {
                colorPrimary: '#bfa76a',
              },
              Button: {
                colorPrimary: '#bfa76a',
              },
              Table: {
                headerBg: '#f8f5ec',
                headerColor: '#4b3a1e',
                borderColor: '#e8e0d0',
                headerSplitColor: '#e8e0d0',
                rowHoverBg: '#f8f5ec',
              },
              Pagination: {
                colorPrimary: '#bfa76a',
                colorPrimaryHover: '#4b3a1e',
              },
              Message: {
                colorSuccess: '#bfa76a',
                colorSuccessBg: '#f8f5ec',
                colorSuccessBorder: '#bfa76a',
              },
            },
          }}
        >
          <Layout>{children}</Layout>
        </ConfigProvider>
      </body>
    </html>
  );
}
