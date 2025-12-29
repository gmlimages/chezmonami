// src/lib/supabase.js
// Configuration du client Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variables d\'environnement manquantes!\n\n' +
    'Assurez-vous que votre fichier .env.local contient:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=votre_url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé\n\n' +
    'Redémarrez ensuite le serveur avec: npm run dev'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);