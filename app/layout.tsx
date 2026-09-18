import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Business World Agent — 纸尿裤电商',
  description: '查看电商经营记录、比较情景并整理可追溯报告；人工来源与估算结果分别标记。',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  const vercelHosted=process.env.VERCEL==='1';
  return <html lang="zh-CN"><body>{children}{vercelHosted?<><Analytics/><SpeedInsights/></>:null}</body></html>;
}
