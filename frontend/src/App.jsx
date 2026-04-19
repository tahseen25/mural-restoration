// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

import useAuthStore from '@/store/authStore';
import Layout       from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Pages
import LandingPage     from '@/pages/LandingPage';
import LoginPage       from '@/pages/LoginPage';
import AuthCallback    from '@/pages/AuthCallback';
import DashboardPage   from '@/pages/DashboardPage';
import RestorePage     from '@/pages/RestorePage';
import HistoryPage     from '@/pages/HistoryPage';
import RestorationDetail from '@/pages/RestorationDetail';
import GalleryPage     from '@/pages/GalleryPage';
import GalleryPostPage from '@/pages/GalleryPostPage';
import ProfilePage     from '@/pages/ProfilePage';
import NotFoundPage    from '@/pages/NotFoundPage';

export default function App() {
  const { initAuth } = useAuthStore();

  // Re-hydrate auth state from localStorage on mount
  useEffect(() => { initAuth(); }, [initAuth]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/"              element={<LandingPage />} />
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/gallery"       element={<Layout><GalleryPage /></Layout>} />
      <Route path="/gallery/:id"   element={<Layout><GalleryPostPage /></Layout>} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard"           element={<DashboardPage />} />
          <Route path="/restore"             element={<RestorePage />} />
          <Route path="/history"             element={<HistoryPage />} />
          <Route path="/history/:id"         element={<RestorationDetail />} />
          <Route path="/profile"             element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
