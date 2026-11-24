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
  },
};

export default nextConfig;
