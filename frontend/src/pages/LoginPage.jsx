// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';

const GOOGLE_OAUTH_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;

export default function LoginPage() {
  const [params]       = useSearchParams();
  const navigate       = useNavigate();
  const { setToken }   = useAuthStore();
  const [mode, setMode]= useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'' });

  const expired = params.get('session') === 'expired';
  const oauthErr= params.get('error') === 'oauth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload  = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const { data } = await api.post(endpoint, payload);
      setToken(data.token);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* ── Left panel — decorative ────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-sm bg-ochre flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 2v16M2 7l8 5 8-5" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="font-display font-semibold text-cream text-lg">Murals Restored</span>
        </Link>

        <div>
          <div className="grid grid-cols-4 gap-2 mb-12 opacity-30">
            {Array.from({length:16}).map((_,i) => (
              <div key={i} className="aspect-square rounded-sm"
                style={{ background: i%3===0?'#c8822a':i%3===1?'#6b7f5a':'#b54e2d', opacity: 0.4+(i%5)*0.12 }} />
            ))}
          </div>
          <blockquote className="font-display text-2xl text-cream/80 italic leading-relaxed mb-4">
            "Every damaged mural is a story half-told. We help finish it."
          </blockquote>
          <p className="text-cream/40 text-sm font-mono">— Murals Restored mission</p>
        </div>

        <p className="text-xs text-cream/30 font-mono">
          Trained on 30,000+ images · 8 Indian mural styles
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {expired  && <div className="mb-4 px-4 py-3 bg-clay/10 border border-clay/20 rounded-sm text-sm text-clay">Session expired. Please sign in again.</div>}
          {oauthErr && <div className="mb-4 px-4 py-3 bg-clay/10 border border-clay/20 rounded-sm text-sm text-clay">Google sign-in failed. Please try again.</div>}

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-ink/50 text-sm">
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button onClick={() => setMode(mode==='login'?'register':'login')}
                className="text-ochre hover:underline">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Google OAuth */}
          <a href={GOOGLE_OAUTH_URL}
            className="flex items-center justify-center gap-3 w-full border border-ink/20
                       py-2.5 rounded-sm text-sm font-medium text-ink
                       hover:bg-ink/5 transition-colors mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-ink/10" />
            <span className="text-xs text-ink/30 font-mono">or</span>
            <div className="flex-1 border-t border-ink/10" />
          </div>

          {/* Local form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full name</label>
                <input className="input" type="text" placeholder="Your name"
                  value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password"
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                required minLength={8} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
                : mode === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
