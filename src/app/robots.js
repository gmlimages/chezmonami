export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard-chezmonami',
          '/entreprise/dashboard/',
          '/entreprise/dashboard',
        ],
      },
    ],
    sitemap: 'https://chezmonami.ma/sitemap.xml',
    host: 'https://chezmonami.ma',
  };
}
