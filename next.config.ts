/** @type {import('next').NextConfig} */
const nextConfig = {
  // 뒤로가기 시 스크롤 위치 자동 복원
  experimental: {
    scrollRestoration: true,
  },
};

module.exports = nextConfig;
