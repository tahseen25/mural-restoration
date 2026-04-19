// src/pages/RestorationDetail.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';

const DOWNLOAD_SIZES = [
  { label: 'Original', value: '' },
  { label: '2048 px',  value: '2048' },
  { label: '1024 px',  value: '1024' },
  { label: '512 px',   value: '512' },
];

export default function RestorationDetail() {
  const { id }    = useParams();
  const qc        = useQueryClient();
  const [showMask, setShowMask] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title:'', description:'', isPublic:true });

  const { data, isLoading } = useQuery({
    queryKey: ['restoration', id],
    queryFn: () => api.get(`/restorations/${id}`).then(r => r.data.job),
    refetchInterval: (d) =>
      ['queued','processing'].includes(d?.status) ? 3000 : false,
  });

  const publishMutation = useMutation({
    mutationFn: (body) => api.post('/gallery', body),
    onSuccess: () => {
      toast.success('Published to gallery!');
      setPublishing(false);
      qc.invalidateQueries(['restoration', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Publish failed'),
  });

  const handleDownload = (size) => {
    const url = size
      ? `/api/restorations/${id}/restored?size=${size}`
      : `/api/restorations/${id}/restored`;
    const a = document.createElement('a');
    a.href  = url;
    a.download = `restored_${id}${size ? `_${size}px` : ''}.png`;

    // Add auth header via fetch + blob
    const token = localStorage.getItem('mural_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        a.href = objUrl;
        a.click();
        URL.revokeObjectURL(objUrl);
      });
  };

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-ochre border-t-transparent animate-spin" />
      </div>
    );
  }

  const job = data;
  const done = job?.status === 'completed';

  return (
    <div className="page max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm text-ink/40">
        <Link to="/history" className="hover:text-ink transition-colors">History</Link>
        <span>/</span>
        <span className="text-ink">{job?.imageId?.originalName || id}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Left: image viewer ──────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-ink">
              {done ? 'Restoration result' : 'Processing…'}
            </h1>
            {done && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMask(p => !p)}
                  className={`btn-ghost text-sm ${showMask ? 'text-ochre' : ''}`}>
                  {showMask ? 'Hide mask' : 'Show mask'}
                </button>
              </div>
            )}
          </div>

          {!done && (
            <div className="card p-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-ochre border-t-transparent
                              animate-spin mx-auto mb-4" />
              <p className="text-ink/60 font-medium capitalize">{job?.status}…</p>
              {job?.status === 'failed' && (
                <p className="text-clay text-sm mt-2">{job.errorMessage}</p>
              )}
            </div>
          )}

          {done && !showMask && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              className="rounded-sm overflow-hidden border border-ink/8">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={`/api/images/${job.imageId?._id}/file`}
                    alt="Original damaged mural"
                    style={{ objectFit: 'contain' }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={`/api/restorations/${id}/restored`}
                    alt="Restored mural"
                    style={{ objectFit: 'contain' }}
                  />
                }
                style={{ maxHeight: '500px' }}
              />
              <p className="text-xs text-ink/30 font-mono text-center py-2 border-t border-ink/5">
                Drag slider to compare · Left: Damaged · Right: Restored
              </p>
            </motion.div>
          )}

          {done && showMask && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              className="rounded-sm overflow-hidden border border-ink/8">
              <img src={`/api/restorations/${id}/mask`} alt="Damage mask"
                className="w-full max-h-[500px] object-contain bg-black" />
              <p className="text-xs text-ink/30 font-mono text-center py-2 border-t border-ink/5">
                Damage mask · White = damaged regions
              </p>
            </motion.div>
          )}
        </div>

        {/* ── Right: metadata + actions ───────────── */}
        <div className="space-y-4">

          {/* Metrics */}
          {done && job.metrics?.psnr && (
            <div className="card p-5">
              <p className="section-label mb-3">Quality metrics</p>
              <div className="space-y-3">
                {[
                  { k:'PSNR',  v: `${job.metrics.psnr?.toFixed(2)} dB`, tip:'Higher is better' },
                  { k:'SSIM',  v: job.metrics.ssim?.toFixed(4),         tip:'0–1, higher is better' },
                  { k:'LPIPS', v: job.metrics.lpips?.toFixed(4),        tip:'Lower is better' },
                ].map(m => (
                  <div key={m.k} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-ink/40 font-mono">{m.k}</p>
                      <p className="text-sm text-ink/30 leading-none">{m.tip}</p>
                    </div>
                    <p className="font-mono font-medium text-ink">{m.v || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model outputs */}
          {done && (
            <div className="card p-5">
              <p className="section-label mb-3">Analysis</p>
              <div className="space-y-2">
                {job.predictedStyle && (
                  <div>
                    <p className="text-xs text-ink/40 mb-1">Predicted style</p>
                    <span className="badge-ochre capitalize">{job.predictedStyle}</span>
                  </div>
                )}
                {job.detectedDamageTypes?.length > 0 && (
                  <div>
                    <p className="text-xs text-ink/40 mb-1">Detected damage</p>
                    <div className="flex flex-wrap gap-1">
                      {job.detectedDamageTypes.map(d => (
                        <span key={d} className="badge-clay capitalize">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-ink/40 mb-1">Mode</p>
                  <span className="text-sm text-ink font-mono">{job.mode}</span>
                </div>
                {job.processingTimeMs && (
                  <div>
                    <p className="text-xs text-ink/40 mb-1">Processing time</p>
                    <span className="text-sm font-mono text-ink">
                      {(job.processingTimeMs/1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Downloads */}
          {done && (
            <div className="card p-5">
              <p className="section-label mb-3">Download</p>
              <div className="space-y-2">
                {DOWNLOAD_SIZES.map(s => (
                  <button key={s.label} onClick={() => handleDownload(s.value)}
                    className="w-full flex items-center justify-between px-3 py-2
                               rounded-sm border border-ink/10 hover:border-ink/30
                               text-sm text-ink/70 hover:text-ink transition-all">
                    <span>{s.label}</span>
                    <span className="text-xs font-mono text-ink/30">↓ PNG</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Publish to gallery */}
          {done && !job.galleryRef && (
            <div className="card p-5">
              <p className="section-label mb-3">Share</p>
              {!publishing ? (
                <button onClick={() => setPublishing(true)} className="btn-primary w-full py-2">
                  Publish to gallery
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="label">Title</label>
                    <input className="input" placeholder="Name your restoration…"
                      value={galleryForm.title}
                      onChange={e => setGalleryForm(p => ({...p, title: e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">Description (optional)</label>
                    <textarea className="input resize-none" rows={3}
                      placeholder="Tell the story of this mural…"
                      value={galleryForm.description}
                      onChange={e => setGalleryForm(p => ({...p, description: e.target.value}))} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={galleryForm.isPublic}
                      onChange={e => setGalleryForm(p => ({...p, isPublic: e.target.checked}))}
                      className="accent-ochre" />
                    <span className="text-sm text-ink/70">Make public</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setPublishing(false)} className="btn-secondary flex-1 py-2">
                      Cancel
                    </button>
                    <button
                      onClick={() => publishMutation.mutate({ restorationId: id, ...galleryForm })}
                      disabled={!galleryForm.title || publishMutation.isPending}
                      className="btn-primary flex-1 py-2">
                      {publishMutation.isPending ? 'Publishing…' : 'Publish'}
                    </button>
                  </div>
                </div>
              )}
              {job.galleryRef && (
                <Link to={`/gallery/${job.galleryRef}`} className="btn-ghost text-sm">
                  View in gallery →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
