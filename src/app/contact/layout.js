export const metadata = {
  title: 'Contact — Parlez-nous',
  description:
    "Contactez l'équipe ChezMonAmi pour toute question, partenariat ou signalement. Nous sommes à votre écoute.",
  openGraph: {
    title: 'Contact | ChezMonAmi',
    description: "Contactez l'équipe ChezMonAmi pour toute question ou partenariat.",
    url: 'https://chezmonami.ma/contact',
  },
  alternates: {
    canonical: 'https://chezmonami.ma/contact',
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function ContactLayout({ children }) {
  return children;
}
