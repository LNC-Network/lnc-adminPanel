/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },

    // Compression for better performance (SEO factor)
    compress: true,

    // Enable React strict mode for better performance
    reactStrictMode: true,

    // Generate ETags for caching
    generateEtags: true,

    // Powered by header removal for security
    poweredByHeader: false,

    // SEO-friendly trailing slashes
    trailingSlash: false,

    // Headers for SEO and security
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
            {
                // Cache static assets
                source: '/icons/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/:path*.svg',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // Redirects for SEO (www to non-www, etc.)
    async redirects() {
        return [];
    },
};

export default nextConfig;
