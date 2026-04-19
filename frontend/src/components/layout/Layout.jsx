// src/components/layout/Layout.jsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/restore',   label: 'Restore' },
  { to: '/history',   label: 'History' },
  { to: '/gallery',   label: 'Gallery' },
];

export default function Layout({ children }) {
  const { user, logout }   = useAuthStore();
  const location           = useLocation();
  const navigate           = useNavigate();
  const [menuOpen, setMenu]= useState(false);
  const [dropOpen, setDrop]= useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-cream/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-sm bg-ochre flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M10 2v16M2 7l8 5 8-5" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="font-display font-semibold text-lg text-ink group-hover:text-ochre transition-colors">
              Murals Restored
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
                  location.pathname.startsWith(l.to)
                    ? 'text-ochre bg-ochre/10'
                    : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDrop(p => !p)}
                  className="flex items-center gap-2 p-1.5 rounded-sm hover:bg-ink/5 transition-colors"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    : <span className="w-7 h-7 rounded-full bg-ochre/20 text-ochre text-sm font-medium flex items-center justify-center">
                        {user.name[0]}
                      </span>
                  }
                  <span className="hidden md:block text-sm font-medium text-ink max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <svg className="w-3.5 h-3.5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-44 bg-white border border-ink/10 rounded-sm shadow-warm-lg py-1 z-50"
                    >
                      <Link to="/profile" onClick={() => setDrop(false)}
                        className="block px-4 py-2 text-sm text-ink hover:bg-ink/5">Profile</Link>
                      <div className="divider my-1" />
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-clay hover:bg-clay/5">
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenu(p => !p)} className="md:hidden p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-ink/8 bg-cream"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMenu(false)}
                    className="block px-3 py-2 text-sm font-medium text-ink/70 hover:text-ink rounded-sm">
                    {l.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-clay">
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-ink/8 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-ink/40 font-mono">© 2025 Murals Restored</p>
          <p className="text-xs text-ink/40">Preserving heritage through deep learning</p>
        </div>
      </footer>
    </div>
  );
}
