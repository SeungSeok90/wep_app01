import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 대형 패키지 트리쉐이킹으로 번들 크기 절감
    optimizePackageImports: ['qrcode', 'xlsx'],
  },
  // 외부 이미지 도메인 허용 (OG 이미지 등)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
