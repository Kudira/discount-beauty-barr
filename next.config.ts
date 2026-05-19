import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://wozafkhezwfabxhegpvw.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvemFma2hlendmYWJ4aGVncHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzEyOTksImV4cCI6MjA5NDEwNzI5OX0.4jf3f8kz8hQuJw8cp11wISdKaZbQQI_EjmphO-bhAp8',
    NEXT_PUBLIC_APP_URL: 'https://discountbeautybarr.vercel.app',
  },
}

export default nextConfig