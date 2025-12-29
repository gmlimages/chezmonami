// src/lib/supabase.js
// Configuration du client Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Vérification seulement en développement (pas pendant le build)
if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '⚠️ Variables d\'environnement manquantes!\n\n' +
    'Assurez-vous que votre fichier .env.local contient:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=votre_url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé\n\n' +
    'Redémarrez ensuite le serveur avec: npm run dev'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);