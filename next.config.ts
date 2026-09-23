import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/business-world/reports/export': ['./lib/business-world/fonts/NotoSansSC-Regular.ttf'],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withEve(nextConfig);
