import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// FFmpeg binaries are spawned as child processes, so file tracing cannot discover them.
// They are only needed where createPostAction runs (the composer lives on /dashboard).
const ffmpegBinaries = [
  "./node_modules/ffmpeg-static/ffmpeg",
  "./node_modules/.pnpm/ffmpeg-static@*/node_modules/ffmpeg-static/ffmpeg",
  "./node_modules/.pnpm/@ffprobe-installer+linux-x64@*/node_modules/@ffprobe-installer/linux-x64/**/*",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },

  serverExternalPackages: ["sharp", "ffmpeg-static", "@ffprobe-installer/ffprobe"],

  experimental: {
    serverActions: {
      // Verification uploads send two downscaled photos in one action; Vercel caps request bodies at 4.5 MB.
      bodySizeLimit: "4mb",
    },
  },

  outputFileTracingIncludes: {
    "/dashboard": ffmpegBinaries,
    // The status page compares these folders with the applied migrations.
    "/admin": ["./prisma/migrations/**/*"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The app is never embedded in other sites (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

// Without SENTRY_AUTH_TOKEN the build works, only source maps are not uploaded.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
});
