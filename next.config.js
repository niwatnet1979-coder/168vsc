/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? '/168vsc' : '',
    assetPrefix: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? '/168vsc/' : '',
}

module.exports = nextConfig
