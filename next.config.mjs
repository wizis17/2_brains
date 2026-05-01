/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Allow pdfjs-dist to work in Next.js
    config.resolve.alias["canvas"] = false;
    config.resolve.alias["encoding"] = false;
    return config;
  },
};

export default nextConfig;
