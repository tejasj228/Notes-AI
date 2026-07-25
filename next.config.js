/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Notes stored as base64 images can be large; allow bigger inline payloads in dev.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
