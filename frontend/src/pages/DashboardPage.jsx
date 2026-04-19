// src/pages/DashboardPage.jsx
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';

const StatCard = ({ label, value, sub, accent = false }) => (
  <motion.div whileHover={{ y: -2 }} className="card p-5">
    <p className="section-label mb-2">{label}</p>
    <p className={`font-display text-3xl font-bold ${accent ? 'text-ochre' : 'text-ink'}`}>{value}</p>
    {sub && <p className="text-xs text-ink/40 mt-1">{sub}</p>}
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get('/users/me/stats').then(r => r.data.stats),
  });

  const { data: historyData } = useQuery({
    queryKey: ['restorations', { page: 1, limit: 4 }],
    queryFn: () => api.get('/restorations?limit=4').then(r => r.data),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="section-label mb-1">{greeting()}</p>
          <h1 className="font-display text-3xl font-bold text-ink">{user?.name?.split(' ')[0]}</h1>
        </div>
        <Link to="/restore" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New restoration
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger">
        <StatCard label="Total jobs"     value={statsData?.totalJobs ?? '—'} />
        <StatCard label="Completed"      value={statsData?.completedJobs ?? '—'} accent />
        <StatCard label="Gallery posts"  value={statsData?.galleryPosts ?? '—'} />
        <StatCard label="Storage used"   value={statsData ? `${statsData.storageUsedMB} MB` : '—'}
                  sub="Max 500 MB" />
      </div>

      {/* Recent restorations */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Recent restorations</h2>
        <Link to="/history" className="btn-ghost text-sm">View all →</Link>
      </div>

      {historyData?.jobs?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4 opacity-30">◈</div>
          <h3 className="font-display text-lg font-semibold text-ink mb-2">No restorations yet</h3>
          <p className="text-ink/50 text-sm mb-6">Upload a mural image to get started.</p>
          <Link to="/restore" className="btn-primary">Restore your first mural</Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {historyData?.jobs?.map((job, i) => (
          <motion.div
            key={job._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link to={`/history/${job._id}`} className="card-hover block p-4 group">
              {/* Placeholder image area */}
              <div className="aspect-square rounded-sm bg-ink/5 mb-3 overflow-hidden">
                {job.status === 'completed' ? (
                  <img
                    src={`/api/restorations/${job._id}/restored?size=256`}
                    alt="Restored"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full border-2 border-t-transparent animate-spin
                      ${job.status==='failed' ? 'border-clay' : 'border-ochre'}`} />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-ink truncate mb-1">
                {job.imageId?.originalName || 'Untitled'}
              </p>
              <div className="flex items-center justify-between">
                <span className={`badge text-xs
                  ${job.status==='completed' ? 'badge-sage'
                  : job.status==='failed'    ? 'badge-clay'
                  : 'badge-ochre'}`}>
                  {job.status}
                </span>
                {job.metrics?.psnr && (
                  <span className="text-xs font-mono text-ink/40">
                    {job.metrics.psnr.toFixed(1)} dB
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
