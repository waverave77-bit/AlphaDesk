/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // /game → /trading-simulator (permanent — tells Google the new canonical URL)
      { source: '/game', destination: '/trading-simulator', permanent: true },
    ]
  },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    instrumentationHook: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
  },
  serverExternalPackages: ['@prisma/client'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
