// src/components/DateDisplay.js
'use client';
import { useState, useEffect } from 'react';

export default function DateDisplay() {
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    setDateString(new Date().toLocaleDateString('fr-FR'));
  }, []);

  if (!dateString) {
    // Rendu côté serveur : date placeholder
    return <span>Chargement...</span>;
  }

  return <span>{dateString}</span>;
}