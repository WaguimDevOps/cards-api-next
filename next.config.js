/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['images.ygoprodeck.com', 'cdn.ygorganization.com'],
  },
  trailingSlash: true,
};

module.exports = nextConfig;
