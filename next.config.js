/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
    ],
  },
  // Firebase Auth's Node build pulls in undici (a fetch polyfill) which uses
  // syntax this webpack version's parser chokes on. It's only reachable from
  // firebase/auth's Node entry point, which our client-only app never hits
  // (the browser bundle uses native fetch), so it's safe to stub out.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      undici: false,
    }
    return config
  },
}
module.exports = nextConfig
