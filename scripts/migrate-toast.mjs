// Script de migration : remplace alert() / confirm() par toast / confirmDialog
// dans toutes les pages admin. À exécuter une seule fois.
//
// Usage : node scripts/migrate-toast.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'src/app/admin';
const IMPORT_LINE = "import { toast, confirmDialog } from '@/lib/toast';";

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (p.endsWith('.js')) yield p;
  }
}

function classifyAlert(arg) {
  if (/^['"`]?\s*(✅|🎉|👍)/.test(arg)) return 'success';
  if (/^['"`]?\s*(❌|🚫|⛔)/.test(arg)) return 'error';
  if (/^['"`]?\s*(⚠️|🔔|⏰)/.test(arg)) return 'warning';
  if (/^['"`]?\s*(ℹ️|💡)/.test(arg)) return 'info';
  // Heuristique sur les mots-clés
  if (/erreur|échec|impossible|invalide|incorrect/i.test(arg)) return 'error';
  if (/réussi|succès|enregistré|sauvegardé|créé|ajouté|modifié|supprimé|envoyé/i.test(arg)) return 'success';
  if (/veuillez|requis|obligatoire|sélectionnez|remplissez/i.test(arg)) return 'warning';
  return 'info';
}

let touched = 0;
let alerts = 0;
let confirms = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // 1) Remplacer alert(...) par toast.<type>(...)
  src = src.replace(/\balert\(\s*([\s\S]*?)\)\s*;/g, (m, arg) => {
    alerts++;
    const type = classifyAlert(arg.trim());
    // Retirer l'emoji de tête (le toast en a déjà un)
    const cleaned = arg.replace(/^(['"`])\s*(✅|❌|⚠️|⏰|🚫|🎉|ℹ️|💡|🔔|⛔)\s*/, '$1');
    return `toast.${type}(${cleaned});`;
  });

  // 2) if (!confirm(...)) return;  →  if (!(await confirmDialog({ message: ... }))) return;
  src = src.replace(/if\s*\(\s*!\s*confirm\(\s*([\s\S]*?)\)\s*\)\s*return\s*;/g, (m, arg) => {
    confirms++;
    return `if (!(await confirmDialog({ message: ${arg.trim()}, danger: true }))) return;`;
  });

  // 3) if (!confirm(...)) { return; }  (avec accolades)
  src = src.replace(/if\s*\(\s*!\s*confirm\(\s*([\s\S]*?)\)\s*\)\s*\{\s*return\s*;\s*\}/g, (m, arg) => {
    confirms++;
    return `if (!(await confirmDialog({ message: ${arg.trim()}, danger: true }))) { return; }`;
  });

  // 4) if (confirm(...)) { ... }  →  if (await confirmDialog(...)) { ... }
  src = src.replace(/if\s*\(\s*confirm\(\s*([\s\S]*?)\)\s*\)/g, (m, arg) => {
    confirms++;
    return `if (await confirmDialog({ message: ${arg.trim()} }))`;
  });

  // 5) Tout confirm( restant (cas exotiques) → confirmDialog (à vérifier manuellement)
  src = src.replace(/(?<!confirmDialog\()\bconfirm\(\s*([\s\S]*?)\)/g, (m, arg) => {
    confirms++;
    return `(await confirmDialog({ message: ${arg.trim()} }))`;
  });

  if (src === original) continue;

  // Ajouter l'import si manquant — juste après 'use client';
  if (!src.includes("from '@/lib/toast'")) {
    if (src.includes("'use client'")) {
      src = src.replace(/('use client';?\s*\n)/, `$1${IMPORT_LINE}\n`);
    } else {
      src = `${IMPORT_LINE}\n${src}`;
    }
  }

  writeFileSync(file, src);
  touched++;
  console.log(`✓ ${file}`);
}

console.log(`\nMigration terminée : ${touched} fichier(s) modifié(s), ${alerts} alert(), ${confirms} confirm() remplacés.`);
