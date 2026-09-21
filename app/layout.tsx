import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ProductAnalytics } from './_components/product-analytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'Business World Agent — 纸尿裤电商',
  description: '基于 Vercel eve 的纸尿裤电商消费者世界、内容、直播与增长决策产品 Demo。',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return <html lang="zh-CN"><body>{children}<ProductAnalytics/></body></html>;
}
