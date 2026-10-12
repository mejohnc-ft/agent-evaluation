import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The prompt builder reads these at runtime (src/lib/prompt/build.ts).
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge/*.md", "./src/lib/prompt/system.md"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// BotID adds the rewrites its invisible challenge needs (see src/instrumentation-client.ts).
export default withBotId(nextConfig);
