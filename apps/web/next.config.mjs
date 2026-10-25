/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Route segments use `instant` during the Next 16 cache-components migration.
  // Enable the matching framework feature instead of leaving every route invalid.
  cacheComponents: true,
  partialPrefetching: true,
  output: 'standalone',
  transpilePackages: ['@psm-os/ui', '@psm-os/types', '@psm-os/validation', '@psm-os/constants', '@psm-os/utils'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@tanstack/react-query',
      'clsx',
      'tailwind-merge',
      'date-fns'
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp']
  }
};

export default nextConfig;
