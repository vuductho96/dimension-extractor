/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the 'canvas' optional dependency warning from pdfjs-dist on server
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias['canvas'] = false;
    }
    return config;
  },
};

export default nextConfig;
