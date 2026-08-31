import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Scope Turbopack to this project (avoids picking up parent folders)
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
