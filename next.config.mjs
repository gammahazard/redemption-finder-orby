/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      CRONOSCAN_API_KEY: process.env.CRONOSCAN_API_KEY
    },
    webpack: (config) => {
      config.resolve.fallback = { fs: false, net: false, tls: false };
      return config;
    },
    images: {
      unoptimized: true
    }
};
  
export default nextConfig;