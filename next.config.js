/** @type {import('next').NextConfig} */
// Force restart server
const nextConfig = {
    // Removed 'output: export' to enable API Routes for NextAuth
    images: {
        unoptimized: true,
    },
    basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? '/168vsc' : '',
    assetPrefix: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? '/168vsc/' : '',
}

module.exports = nextConfig
