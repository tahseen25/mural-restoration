// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '◈',
    title: 'AI-Powered Restoration',
    desc: 'A dual-stage deep learning model — StructureNet + TextureNet — trained on thousands of Indian murals.',
  },
  {
    icon: '◉',
    title: 'Damage Detection',
    desc: 'Automatically identifies fading, cracking, staining, peeling, moisture damage, and flaking.',
  },
  {
    icon: '◫',
    title: 'Style Classification',
    desc: 'Recognises Warli, Madhubani, Gond, Kalighat, Kerala Mural, and five other traditional styles.',
  },
  {
    icon: '⊞',
    title: 'Community Gallery',
    desc: 'Share your restored murals, like and comment on others' work, build a living archive of heritage.',
  },
];

const STYLES = ['Warli','Madhubani','Gond','Kalighat','Kerala Mural','Pichwai','Kangra','Mandana'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-sm bg-ochre flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 2v16M2 7l8 5 8-5" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="font-display font-semibold text-lg">Murals Restored</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/gallery" className="text-sm text-ink/60 hover:text-ink transition-colors">Gallery</Link>
          <Link to="/login" className="btn-primary text-sm py-2">Sign in</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-label mb-4">Heritage Preservation · AI Restoration</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-ink leading-tight mb-6">
              Breathe life back into{' '}
              <em className="text-ochre not-italic">ancient murals</em>
            </h1>
            <p className="text-lg text-ink/60 leading-relaxed mb-8 max-w-xl">
              Upload damaged mural photographs. Our deep learning model — trained on 30,000 images
              across eight classical Indian styles — restores colour, texture, and detail with
              museum-grade precision.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary px-7 py-3 text-base">
                Start restoring
              </Link>
              <Link to="/gallery" className="btn-secondary px-7 py-3 text-base">
                View gallery
              </Link>
            </div>
          </motion.div>

          {/* Decorative tile grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-3 gap-3">
              {STYLES.map((style, i) => (
                <div
                  key={style}
                  className="aspect-square rounded-sm bg-gradient-to-br from-ink/5 to-ink/10
                             border border-ink/10 flex items-end p-3 overflow-hidden relative group"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="text-xs font-mono text-ink/30 group-hover:text-ink/60 transition-colors">
                    {style}
                  </span>
                  {/* Decorative dot pattern */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle, #c8822a 1px, transparent 1px)`,
                      backgroundSize: `${12 + (i % 3) * 4}px ${12 + (i % 3) * 4}px`,
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Floating metric card */}
            <div className="absolute -bottom-4 -left-4 card px-4 py-3 shadow-warm-lg">
              <p className="text-xs text-ink/40 font-mono">avg. PSNR improvement</p>
              <p className="text-2xl font-display font-bold text-ochre">+28.5 dB</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="border-t border-ink/8 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <p className="section-label text-center mb-12">How it works</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {FEATURES.map(f => (
              <motion.div
                key={f.title}
                className="card p-6 animate-fade-up"
                whileHover={{ y: -2 }}
              >
                <div className="text-2xl text-ochre mb-4">{f.icon}</div>
                <h3 className="font-display font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-20 border-t border-ink/8">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="font-display text-4xl font-bold text-ink mb-4">
            Preserve a piece of history today
          </h2>
          <p className="text-ink/60 mb-8">
            Free to start. No credit card required.
          </p>
          <Link to="/login" className="btn-primary px-8 py-3 text-base">
            Create free account
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <p className="text-xs text-ink/40 font-mono">© 2025 Murals Restored</p>
          <p className="text-xs text-ink/40">Preserving heritage through deep learning</p>
        </div>
      </footer>
    </div>
  );
}
