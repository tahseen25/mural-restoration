// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-mono text-6xl font-bold text-ink/10 mb-4">404</p>
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Page not found</h1>
        <p className="text-ink/50 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">Go home</Link>
      </div>
    </div>
  );
}
