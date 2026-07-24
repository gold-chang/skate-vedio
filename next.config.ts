import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 뒤로가기 시 스크롤 위치 자동 복원
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;