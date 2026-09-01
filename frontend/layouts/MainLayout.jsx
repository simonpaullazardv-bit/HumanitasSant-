import React from 'react';
import Navbar from '../components/Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="content">{children}</main>
      <footer className="footer">
        <p>&copy; 2026 Humanitas Santé & Centre de Bien-Être. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
