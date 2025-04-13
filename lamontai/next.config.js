/** @type {import('next').NextConfig} */
const nextConfig = {
  serverComponentsExternalPackages: ['bcryptjs'],
  env: {
    PORT: "3001"
  }
};

module.exports = nextConfig;

