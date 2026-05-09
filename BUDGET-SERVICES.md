# Liste des services externes à mettre en place — ChezMonAmi

Ce document recense l'ensemble des services tiers et abonnements à souscrire pour activer toutes les fonctionnalités planifiées (Lots A à H + agrégateur d'appels d'offres). Chaque ligne précise le besoin, le prix indicatif, les alternatives et le lien d'inscription.

> Astuce : commencer par les **services obligatoires** (badge ⭐). Les autres peuvent attendre la mise en production de la fonctionnalité concernée.

---

## 1. Email transactionnel ⭐

**Besoin** : envoi d'emails automatiques (validation badge, nouveaux appels d'offres, demandes de mise en relation, alertes ciblées, réinitialisation mot de passe).

| Service | Prix | Inclus | Lien |
|---|---|---|---|
| **Resend** (recommandé) | Gratuit jusqu'à 3 000 emails/mois, puis 20 $/mois pour 50 000 | API moderne, intégration Next.js native, domaine vérifié | https://resend.com |
| Postmark | 15 $/mois pour 10 000 emails | Excellente délivrabilité transactionnelle | https://postmarkapp.com |
| SendGrid | Gratuit jusqu'à 100/jour, puis 20 $/mois | Standard du marché | https://sendgrid.com |
| Brevo (ex-Sendinblue) | Gratuit jusqu'à 300/jour | Bonne option si campagnes marketing aussi | https://www.brevo.com |

**Action** : créer un compte Resend, vérifier le domaine `chezmonami.com` (DNS DKIM/SPF), récupérer la clé API → variable d'env `RESEND_API_KEY`.

---

## 2. SMS / WhatsApp (2FA + alertes ciblées) — Lot G & H

**Besoin** : code à 6 chiffres pour 2FA optionnelle + alertes nouveaux appels d'offres ciblés (canal WhatsApp préféré en Afrique).

| Service | Prix indicatif | Couverture Afrique | Lien |
|---|---|---|---|
| **Meta WhatsApp Cloud API** (recommandé) | Gratuit jusqu'à 1 000 conversations/mois, puis ~0,005-0,08 $/message selon pays | Excellente, prix variable selon pays | https://business.whatsapp.com/cloud-api |
| Twilio | ~0,05-0,20 $/SMS Afrique, WhatsApp ~0,01-0,08 $ | Très large | https://www.twilio.com |
| Vonage | ~0,06-0,15 $/SMS | Bonne | https://www.vonage.com |
| Africa's Talking | Tarifs locaux compétitifs (1-10 FCFA/SMS) | Excellente, spécialisé Afrique | https://africastalking.com |

**Recommandation** : combiner **WhatsApp Cloud API** (canal principal) + **Africa's Talking** (fallback SMS pour pays/numéros sans WhatsApp). Budget initial : ~50 €/mois pour 5 000 messages.

**Action** : créer un compte Meta Business + vérifier le numéro WhatsApp Business (template approval ~1 semaine).

---

## 3. Stockage de fichiers (déjà couvert par Supabase)

Supabase Storage est inclus. Surveiller le quota : 1 Go gratuit, puis 0,021 $/Go/mois. Aucune action requise sauf si > 50 Go.

---

## 4. Hébergement & CDN

| Service | Prix | Inclus | Lien |
|---|---|---|---|
| **Vercel** (recommandé Next.js) | Gratuit (Hobby) → 20 $/mois (Pro) | Cron jobs, Edge functions, analytics | https://vercel.com |
| Netlify | Similaire | Alternative | https://netlify.com |

⚠️ **Vercel Cron** est nécessaire pour l'**agrégateur d'appels d'offres** (passage automatique 1 à 4 fois/jour). Plan Pro requis pour cron > 1×/jour.

---

## 5. Agrégateur d'appels d'offres externes

### 5.1 IA de catégorisation

✅ **Couvert par votre abonnement Anthropic Pro** (Claude Haiku via API). Pour info :
- Tarif Haiku : ~0,25 $/million tokens en entrée, 1,25 $/million en sortie.
- Estimation : 500 appels d'offres/jour × 1 000 tokens = ~0,40 $/mois. Négligeable.

Si dépassement quota Pro → créer une clé API séparée sur https://console.anthropic.com (paiement à l'usage).

### 5.2 Proxy / scraping (certains portails nationaux bloquent les datacenters)

| Service | Prix | Quand l'utiliser |
|---|---|---|
| **ScraperAPI** | Gratuit 1 000 req/mois, puis 49 $/mois | Si portails nationaux (Maroc, Sénégal, CI) bloquent |
| Bright Data | À partir de 50 $/mois | Plus puissant, plus cher |
| Aucun (départ) | 0 € | Tester d'abord sans proxy |

**Recommandation** : démarrer **sans proxy**. N'ajouter qu'en cas de blocage avéré (HTTP 403 répétés).

### 5.3 Sources de données ouvertes (gratuites)

- **UNGM** (United Nations Global Marketplace) : RSS gratuit → https://www.ungm.org
- **Banque Mondiale** : API publique → https://projects.worldbank.org/api
- **BAD (Banque Africaine de Développement)** : flux ouverts → https://www.afdb.org/en/projects-and-operations/procurement
- **BOAD** : à scraper → https://www.boad.org
- **TED Europa** (UE) : API ouverte si pertinent → https://ted.europa.eu

Aucun coût.

---

## 6. Génération d'images Open Graph dynamiques (Lot B)

✅ **Gratuit** via `next/og` (déjà inclus dans Next.js 15). Aucun service externe requis.

---

## 7. Monitoring & observabilité (optionnel mais recommandé)

| Service | Prix | Usage |
|---|---|---|
| **Sentry** | Gratuit jusqu'à 5 000 erreurs/mois | Suivi erreurs front + back |
| Vercel Analytics | Inclus dans plan Pro | Trafic, Core Web Vitals |
| Better Stack (Logtail) | Gratuit jusqu'à 1 Go logs/mois | Logs centralisés agrégateur |

---

## 8. Nom de domaine & SSL

✅ Si déjà acheté → rien à faire. SSL inclus via Vercel/Netlify gratuitement.

---

## Récapitulatif budget mensuel estimé

| Phase | Service | Coût/mois |
|---|---|---|
| **Démarrage (obligatoire)** | Resend (email) | 0 € (free tier) |
| | Vercel Hobby | 0 € |
| | Supabase Free | 0 € |
| | **Total démarrage** | **~0 €/mois** |
| **Production (recommandé)** | Vercel Pro | 20 $ |
| | Resend Pro | 20 $ |
| | WhatsApp Cloud + Africa's Talking | ~50 € |
| | Sentry | 0 € (free tier) |
| | **Total production** | **~85-90 €/mois** |
| **Optionnel agrégateur avancé** | ScraperAPI | 49 $ |
| | Anthropic surconsommation | <5 $ |

---

## Ordre suggéré de souscription

1. **Maintenant** : Resend (5 min) — débloque tous les emails automatiques
2. **Avant Lot B (SEO)** : passer Vercel Pro pour activer cron + analytics
3. **Avant Lot G (alertes)** : créer compte Meta WhatsApp Business (1-2 semaines de validation)
4. **Avant Lot H (2FA)** : créer compte Africa's Talking en fallback
5. **Si blocage scraping** : ScraperAPI

---

*Document généré le 2026-05-02. À mettre à jour quand de nouveaux services sont ajoutés.*
