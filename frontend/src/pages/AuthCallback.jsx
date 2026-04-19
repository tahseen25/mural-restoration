// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

/**
 * Google redirects here with ?token=<jwt>.
 * We store the token and redirect to dashboard.
 */
export default function AuthCallback() {
  const [params]     = useSearchParams();
  const navigate     = useNavigate();
  const { setToken } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      toast.success('Signed in with Google!');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error('Authentication failed.');
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-ochre border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
