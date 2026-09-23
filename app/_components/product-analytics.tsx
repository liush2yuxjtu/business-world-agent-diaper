'use client';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function ProductAnalytics() {
  const pathname = usePathname();
  // Shared-link credentials must never enter analytics events.
  if (pathname === '/shared-report') return null;
  return <><Analytics/><SpeedInsights/></>;
}
