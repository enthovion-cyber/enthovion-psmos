/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@psm-os/ui', '@psm-os/types', '@psm-os/validation', '@psm-os/constants', '@psm-os/utils']
};

export default nextConfig;
