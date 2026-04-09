// src/app/admin/AdminSidebar.js
// Utilisé par admin/dashboard/page.js (page sans AdminLayout)
'use client';
import { useState } from 'react';
import AdminSidebarContent from './AdminSidebarContent';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-xl transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <AdminSidebarContent
          isOpen={isOpen}
          admin={null}
          tempsRestant={null}
          formatTemps={null}
          onLogout={null}
        />
      </aside>

      {/* Toggle Desktop */}
      <div className={`fixed bottom-6 z-40 hidden lg:flex transition-all duration-300 ${isOpen ? 'left-[232px]' : 'left-[56px]'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border border-gray-200 shadow-md rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <span className="text-sm">{isOpen ? '◀' : '▶'}</span>
        </button>
      </div>

      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
