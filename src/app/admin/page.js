// src/app/admin/page.js
// Cette page redirige vers l'accueil pour masquer l'existence de l'admin
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers la page d'accueil
    router.replace('/');
  }, [router]);

  // Page vide pendant la redirection (très rapide)
  return null;
}