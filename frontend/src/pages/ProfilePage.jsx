// src/pages/ProfilePage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    preferences: {
      defaultOutputSize:    user?.preferences?.defaultOutputSize    || 'original',
      autoPublishToGallery: user?.preferences?.autoPublishToGallery || false,
    },
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [activeTab, setActiveTab] = useState('profile');

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get('/users/me/stats').then(r => r.data.stats),
  });

  const profileMutation = useMutation({
    mutationFn: (body) => api.patch('/users/me', body),
    onSuccess: ({ data }) => {
      setUser(data.user);
      toast.success('Profile updated!');
      qc.invalidateQueries(['user-stats']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (body) => api.patch('/users/me/password', body),
    onSuccess: () => {
      toast.success('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const TABS = [
    { key: 'profile',  label: 'Profile' },
    { key: 'security', label: 'Security' },
  ];

  return (
    <div className="page max-w-2xl">
      <div className="mb-8">
        <p className="section-label mb-1">Account</p>
        <h1 className="font-display text-3xl font-bold text-ink">Profile settings</h1>
      </div>

      {/* Avatar + stats strip */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        {user?.avatar
          ? <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
          : <div className="w-16 h-16 rounded-full bg-ochre/20 text-ochre text-2xl font-display font-semibold
                           flex items-center justify-center">
              {user?.name?.[0]}
            </div>
        }
        <div className="flex-1">
          <p className="font-display font-semibold text-ink text-lg">{user?.name}</p>
          <p className="text-sm text-ink/50">{user?.email}</p>
          <span className={`badge mt-1 ${user?.authProvider==='google' ? 'badge-sage' : 'badge-ink'}`}>
            {user?.authProvider === 'google' ? '● Google account' : '● Email account'}
          </span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-display font-bold text-ochre">{statsData?.completedJobs ?? '—'}</p>
          <p className="text-xs text-ink/40">restorations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink/5 rounded-sm p-1 mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-sm text-sm font-medium transition-all
              ${activeTab === t.key ? 'bg-white shadow-warm text-ink' : 'text-ink/50 hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ──────────────────────────── */}
      {activeTab === 'profile' && (
        <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 space-y-5">
          <div>
            <label className="label">Display name</label>
            <input className="input" value={profileForm.name}
              onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div className="divider" />

          <div>
            <p className="section-label mb-3">Preferences</p>

            <div className="space-y-4">
              <div>
                <label className="label">Default download size</label>
                <select className="input"
                  value={profileForm.preferences.defaultOutputSize}
                  onChange={e => setProfileForm(p => ({
                    ...p,
                    preferences: { ...p.preferences, defaultOutputSize: e.target.value }
                  }))}>
                  <option value="original">Original size</option>
                  <option value="2048">2048 px</option>
                  <option value="1024">1024 px</option>
                  <option value="512">512 px</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox"
                    className="sr-only peer"
                    checked={profileForm.preferences.autoPublishToGallery}
                    onChange={e => setProfileForm(p => ({
                      ...p,
                      preferences: { ...p.preferences, autoPublishToGallery: e.target.checked }
                    }))} />
                  <div className="w-10 h-5 bg-ink/10 rounded-full peer-checked:bg-ochre transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                                  shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Auto-publish to gallery</p>
                  <p className="text-xs text-ink/40">Share every completed restoration publicly</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={() => profileMutation.mutate(profileForm)}
            disabled={profileMutation.isPending}
            className="btn-primary">
            {profileMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </motion.div>
      )}

      {/* ── Security tab ─────────────────────────── */}
      {activeTab === 'security' && (
        <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6">
          {user?.authProvider === 'google' ? (
            <div className="text-center py-6">
              <p className="text-ink/50 text-sm">
                Your account uses Google Sign-In. Password management is handled by Google.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-ink">Change password</h3>
              <div>
                <label className="label">Current password</label>
                <input className="input" type="password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div>
                <label className="label">New password</label>
                <input className="input" type="password" minLength={8}
                  placeholder="At least 8 characters"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <button
                onClick={() => passwordMutation.mutate(pwForm)}
                disabled={!pwForm.currentPassword || !pwForm.newPassword || passwordMutation.isPending}
                className="btn-primary">
                {passwordMutation.isPending ? 'Updating…' : 'Update password'}
              </button>
            </div>
          )}

          <div className="divider my-6" />

          {/* Storage */}
          <div>
            <p className="section-label mb-3">Storage usage</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink/60">{statsData?.storageUsedMB ?? '0'} MB used</span>
              <span className="text-sm text-ink/40">500 MB limit</span>
            </div>
            <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
              <div className="h-full bg-ochre rounded-full transition-all"
                style={{ width: `${Math.min(100, ((statsData?.storageUsedMB || 0) / 500) * 100)}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
