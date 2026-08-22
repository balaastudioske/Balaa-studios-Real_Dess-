import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  devIndicators: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  turbopack: {},
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei', 'lucide-react', 'zustand'],
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com; media-src 'self' blob:; connect-src 'self' blob: https://www.youtube-nocookie.com https://*.googleapis.com https://cdn.jsdelivr.net https://unpkg.com wss: ws:; frame-src https://www.youtube-nocookie.com; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" },
      ],
    }]
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
    };
    if (isServer) {
      config.externals = [...(config.externals || []), 'three'];
    }
    return config;
  },
};

export default nextConfig;
