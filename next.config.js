/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static page generation
  output: 'standalone',
  
  // Configure images domains if needed
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configure webpack if needed
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }
    return config
  },

  // Strict mode for better development
  reactStrictMode: true,

  // TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
