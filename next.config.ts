import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["zod"],
  turbopack: {
    root: process.cwd(),
  },
};

export default withEve(nextConfig);
