/** @type {import('next').NextConfig} */

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? (await import('@next/bundle-analyzer')).default({ enabled: true })
  : (cfg) => cfg;

const nextConfig = {
  reactCompiler: true,

  // Optimisation des images : autorise next/image pour Supabase Storage et l'app
  images: {
    // Autorise toutes les images HTTPS (bannières admin, photos uploadées via URL)
    // Les images Supabase sont optimisées normalement ; les autres passent en proxy Next.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Headers de sécurité supplémentaires (complète le middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      // Empêcher l'indexation des routes admin et API
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/admin/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/dashboard-chezmonami',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
