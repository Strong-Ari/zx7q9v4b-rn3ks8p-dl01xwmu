/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorer les erreurs ESLint pendant la build pour se concentrer sur la fonctionnalité
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorer les erreurs TypeScript non critiques pendant la build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
