import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.bbcgoodfood.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'images.immediate.co.uk' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
