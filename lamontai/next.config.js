/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  },
  env: {
    PORT: "3001"
  }
};

module.exports = nextConfig;

