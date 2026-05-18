import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Bundle all CSS into a single chunk — prevents layout.css 404s on client-side navigation
  experimental: {
    cssChunking: false,
  },

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{ source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' }]
      : []
  },
}

export default nextConfig
