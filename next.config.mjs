/**
 * SwapStay frontend
 *
 * The UI talks to the API through a same-origin `/api` path. In development (and
 * optionally in production) a rewrite proxies that path to the deployed backend,
 * which avoids CORS and keeps bearer tokens in the browser only.
 *
 *   BACKEND_URL=https://hackerwrath3-0.vercel.app   -> /api/* proxied there
 *   NEXT_PUBLIC_API_BASE_URL=https://...            -> absolute calls, no proxy
 */
const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
