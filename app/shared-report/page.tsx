import type { Metadata } from 'next';
import { SharedReportReader } from './reader';
export const metadata: Metadata = { title: '只读报告 · eve Business World', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function SharedReportPage() { return <SharedReportReader/>; }
