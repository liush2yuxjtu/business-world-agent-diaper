import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: [
    "@cedar-policy/cedar-authorization",
    "@cedar-policy/cedar-wasm",
  ],
  turbopack: {
    root: process.cwd(),
  },
};

export default withEve(nextConfig);
