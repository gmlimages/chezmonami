// src/app/mentions-legales/page.js
'use client';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📋 Mentions Légales
          </h1>
          <p className="text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Éditeur du site</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Le site <strong>Chez Mon Ami</strong> (accessible à l'adresse www.chezmonami.com) est édité par :
              </p>
              <ul className="list-none text-gray-700 space-y-2 mb-4 bg-gray-50 p-4 rounded-lg">
                <li><strong>Raison sociale :</strong> Chez Mon Ami</li>
                <li><strong>Siège social :</strong> Rabat, Maroc</li>
                <li><strong>Directeur de publication :</strong> Vanne Clif NKOY</li>
                <li><strong>Email :</strong> <a href="mailto:contact@chezmonami.com" className="text-primary hover:underline">contact@chezmonami.com</a></li>
                <li><strong>Téléphone :</strong> <a href="tel:+212673623053" className="text-primary hover:underline">+212 673 623 053</a></li>
                <li><strong>Numéro d'immatriculation :</strong> [À compléter ultérieurement]</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Objet du site</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chez Mon Ami est une plateforme de proximité dédiée à l'Afrique, permettant de découvrir et de référencer :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Des structures commerciales (restaurants, salons de beauté, boutiques, services)</li>
                <li>Des produits et articles en vente</li>
                <li>Des annonces professionnelles (emplois, formations, événements, appels d'offres)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                La plateforme met en relation les structures avec les utilisateurs, sans effectuer de transactions financières en ligne.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Propriété intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                L'ensemble du contenu présent sur le site Chez Mon Ami (textes, images, graphismes, logo, icônes, sons, logiciels, etc.) est la propriété exclusive de Chez Mon Ami ou de ses partenaires, sauf mentions contraires.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l'accord exprès par écrit de Chez Mon Ami.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-blue-900">
                  <strong>ℹ️ Important :</strong> Les contenus publiés par les structures (photos, descriptions, informations) restent la propriété de leurs auteurs respectifs.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chez Mon Ami met tout en œuvre pour offrir aux utilisateurs des informations fiables et vérifiées. Cependant, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité des informations diffusées sur le site.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive. Chez Mon Ami ne saurait être tenue responsable :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                <li>Des erreurs ou omissions dans les contenus publiés par les structures</li>
                <li>Des dommages directs ou indirects résultant de l'utilisation du site</li>
                <li>De l'indisponibilité temporaire ou totale du site</li>
                <li>Des contenus des sites tiers vers lesquels renvoient des liens hypertextes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Données personnelles</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chez Mon Ami accorde une grande importance à la protection des données personnelles de ses utilisateurs.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pour plus d'informations sur la collecte, le traitement et la protection de vos données personnelles, veuillez consulter notre{' '}
                <a href="/confidentialite" className="text-primary hover:underline font-semibold">
                  Politique de Confidentialité
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Le site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visite. Pour en savoir plus, consultez notre{' '}
                <a href="#" className="text-primary hover:underline font-semibold">
                  Politique de Cookies
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Droit applicable et juridiction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Les présentes mentions légales sont régies par le droit marocain. En cas de litige et à défaut d'accord amiable, le tribunal compétent sera celui de Rabat, Maroc.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pour toute question concernant les mentions légales, vous pouvez nous contacter :
              </p>
              <ul className="list-none text-gray-700 space-y-2 mb-4 bg-green-50 p-4 rounded-lg">
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <span>Par email : <a href="mailto:contact@chezmonami.com" className="text-primary hover:underline font-semibold">contact@chezmonami.com</a></span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  <span>Par WhatsApp : <a href="https://wa.me/212673623053" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">+212 673 623 053</a></span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Adresse : Rabat, Maroc</span>
                </li>
              </ul>
            </section>

          </div>
        </div>

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}