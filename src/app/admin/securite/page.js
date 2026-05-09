'use client';
// Lot H — Page sécurité admin : activer/désactiver la 2FA par email.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../AdminLayout';
import { toast } from '@/lib/toast';

export default function PageSecurite() {
  const [tfaActive, setTfaActive] = useState(null); // null = chargement
  const [saving, setSaving] = useState(false);
  const [emailAdmin, setEmailAdmin] = useState('');

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      setEmailAdmin(a?.email || '');
    } catch {}
    charger();
  }, []);

  const auth = () => JSON.parse(localStorage.getItem('adminAuth') || '{}');

  const charger = async () => {
    try {
      const res = await fetch('/api/admin/tfa', {
        headers: { Authorization: `Bearer ${auth().sessionToken}` },
      });
      if (res.ok) {
        const d = await res.json();
        setTfaActive(!!d.tfa_active);
      }
    } catch {}
  };

  const basculer = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tfa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth().sessionToken}` },
        body: JSON.stringify({ active: !tfaActive }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || 'Erreur');
      } else {
        setTfaActive(d.tfa_active);
        toast.success(d.tfa_active
          ? 'Authentification à 2 facteurs activée'
          : 'Authentification à 2 facteurs désactivée');
      }
    } catch {
      toast.error('Erreur réseau');
    }
    setSaving(false);
  };

  return (
    <AdminLayout titre="Sécurité" sousTitre="Gérer la sécurité de votre compte admin">
      <div className="max-w-2xl space-y-6">
        {/* 2FA */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🔐 Authentification à 2 facteurs
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                À chaque connexion, un code à 6 chiffres sera envoyé sur votre adresse email
                {emailAdmin && (
                  <> (<strong>{emailAdmin}</strong>)</>
                )}. Ce code est valable 10 minutes.
              </p>
            </div>
            <div className="flex-shrink-0">
              {tfaActive === null ? (
                <span className="text-xs text-gray-400">…</span>
              ) : (
                <button
                  type="button"
                  onClick={basculer}
                  disabled={saving}
                  role="switch"
                  aria-checked={tfaActive}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    tfaActive ? 'bg-green-500' : 'bg-gray-300'
                  } ${saving ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      tfaActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {tfaActive && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✓ La 2FA est <strong>active</strong>. À votre prochaine connexion, un code de vérification vous sera envoyé par email.
            </div>
          )}
          {tfaActive === false && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ La 2FA est <strong>désactivée</strong>. Nous recommandons fortement de l'activer pour protéger votre compte admin.
            </div>
          )}
        </section>

        {/* Mot de passe */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">🔑 Mot de passe</h2>
              <p className="text-sm text-gray-600 mt-1">
                Modifiez régulièrement votre mot de passe (recommandé tous les 90 jours).
              </p>
            </div>
            <Link
              href="/admin/changer-mot-de-passe"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex-shrink-0"
            >
              Changer
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
