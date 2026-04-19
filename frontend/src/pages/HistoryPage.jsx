// src/pages/HistoryPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/services/api';

const StatusBadge = ({ status }) => {
  const cls = {
    completed:  'badge-sage',
    failed:     'badge-clay',
    processing: 'badge-ochre',
    queued:     'badge-ink',
  }[status] || 'badge-ink';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default function HistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['restorations', page],
    queryFn: () => api.get(`/restorations?page=${page}&limit=12`).then(r => r.data),
    keepPreviousData: true,
  });

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label mb-1">Your work</p>
          <h1 className="font-display text-3xl font-bold text-ink">Restoration history</h1>
        </div>
        <Link to="/restore" className="btn-primary">New restoration</Link>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i) => (
            <div key={i} className="card p-4">
              <div className="aspect-square rounded-sm animate-shimmer mb-3" />
              <div className="h-4 animate-shimmer rounded mb-2" />
              <div className="h-3 w-16 animate-shimmer rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data?.jobs?.length === 0 && (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-4 opacity-20">◈</div>
          <h3 className="font-display text-xl font-semibold text-ink mb-2">No restorations yet</h3>
          <p className="text-ink/50 text-sm mb-6">Upload your first mural to get started.</p>
          <Link to="/restore" className="btn-primary">Start restoring</Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.jobs?.map((job, i) => (
          <motion.div key={job._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            transition={{delay: i*0.04}}>
            <Link to={`/history/${job._id}`} className="card-hover block group">
              <div className="aspect-square rounded-t-sm overflow-hidden bg-ink/5">
                {job.status === 'completed' ? (
                  <img
                    src={`/api/restorations/${job._id}/restored?size=256`}
                    alt="Restored"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div className={`w-8 h-8 rounded-full border-2 border-t-transparent
                      ${job.status==='failed'?'border-clay':'border-ochre'} animate-spin`} />
                    <p className="text-xs text-ink/40">{job.status}</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-ink truncate mb-2">
                  {job.imageId?.originalName || 'Untitled'}
                </p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-ink/30 font-mono">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {job.metrics?.psnr && (
                  <div className="mt-2 flex gap-3">
                    <span className="text-xs font-mono text-ink/40">PSNR {job.metrics.psnr.toFixed(1)}</span>
                    <span className="text-xs font-mono text-ink/40">SSIM {job.metrics.ssim?.toFixed(3)}</span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">← Prev</button>
          <span className="text-sm text-ink/50 font-mono">{page} / {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page===data.pages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}
