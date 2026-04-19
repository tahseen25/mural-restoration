// src/pages/GalleryPostPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';

export default function GalleryPostPage() {
  const { id }   = useParams();
  const { user } = useAuthStore();
  const qc       = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['gallery-post', id],
    queryFn: () => api.get(`/gallery/${id}`).then(r => r.data.post),
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/gallery/${id}/like`),
    onSuccess: () => qc.invalidateQueries(['gallery-post', id]),
  });

  const commentMutation = useMutation({
    mutationFn: (text) => api.post(`/gallery/${id}/comments`, { text }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries(['gallery-post', id]);
      toast.success('Comment posted!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to post'),
  });

  const visibilityMutation = useMutation({
    mutationFn: (isPublic) => api.patch(`/gallery/${id}/visibility`, { isPublic }),
    onSuccess: (_, isPublic) => {
      toast.success(isPublic ? 'Post is now public' : 'Post is now private');
      qc.invalidateQueries(['gallery-post', id]);
    },
  });

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-ochre border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page text-center py-20">
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Post not found</h2>
        <Link to="/gallery" className="btn-primary mt-4">Back to gallery</Link>
      </div>
    );
  }

  const restorationId = post.restorationId?._id || post.restorationId;
  const isOwner = user && post.userId?._id === user._id;

  return (
    <div className="page max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm text-ink/40">
        <Link to="/gallery" className="hover:text-ink">Gallery</Link>
        <span>/</span>
        <span className="text-ink truncate max-w-xs">{post.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Image viewer ────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-sm overflow-hidden border border-ink/8 mb-4">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={`/api/images/${post.restorationId?.imageId || restorationId}/file`}
                  alt="Damaged"
                  style={{ objectFit: 'contain' }}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={`/api/restorations/${restorationId}/restored`}
                  alt="Restored"
                  style={{ objectFit: 'contain' }}
                />
              }
              style={{ maxHeight: '520px' }}
            />
            <p className="text-xs text-center text-ink/30 font-mono py-2 border-t border-ink/5">
              Drag to compare · Damaged ← → Restored
            </p>
          </div>

          {/* Metrics strip */}
          {post.restorationId?.metrics?.psnr && (
            <div className="flex gap-6 px-2 mb-6">
              {[
                { k: 'PSNR', v: `${post.restorationId.metrics.psnr?.toFixed(2)} dB` },
                { k: 'SSIM', v: post.restorationId.metrics.ssim?.toFixed(4) },
                { k: 'LPIPS', v: post.restorationId.metrics.lpips?.toFixed(4) },
              ].map(m => (
                <div key={m.k}>
                  <p className="text-xs text-ink/30 font-mono">{m.k}</p>
                  <p className="font-mono text-sm text-ink font-medium">{m.v || '—'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="font-display font-semibold text-ink mb-4">
              Comments ({post.comments?.length ?? 0})
            </h3>

            {post.comments?.length === 0 && (
              <p className="text-ink/40 text-sm mb-4">No comments yet. Be the first!</p>
            )}

            <div className="space-y-4 mb-6">
              {post.comments?.map(c => (
                <motion.div key={c._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3">
                  {c.userId?.avatar
                    ? <img src={c.userId.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-ochre/20 text-ochre text-sm font-medium
                                     flex items-center justify-center flex-shrink-0">
                        {c.userId?.name?.[0]}
                      </div>
                  }
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-ink">{c.userId?.name}</span>
                      <span className="text-xs text-ink/30 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-ink/70 leading-relaxed">{c.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Comment form */}
            {user ? (
              <div className="flex gap-3">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-ochre/20 text-ochre text-sm font-medium
                                   flex items-center justify-center flex-shrink-0">
                      {user.name[0]}
                    </div>
                }
                <div className="flex-1 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && comment.trim() && commentMutation.mutate(comment)}
                    maxLength={500}
                  />
                  <button
                    onClick={() => comment.trim() && commentMutation.mutate(comment)}
                    disabled={!comment.trim() || commentMutation.isPending}
                    className="btn-primary px-4">
                    Post
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink/50">
                <Link to="/login" className="text-ochre hover:underline">Sign in</Link> to comment.
              </p>
            )}
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Author */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              {post.userId?.avatar
                ? <img src={post.userId.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full bg-ochre/20 text-ochre font-semibold
                                 flex items-center justify-center">
                    {post.userId?.name?.[0]}
                  </div>
              }
              <div>
                <p className="font-medium text-ink text-sm">{post.userId?.name}</p>
                <p className="text-xs text-ink/40">
                  {new Date(post.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>

            <h2 className="font-display font-semibold text-ink text-lg mb-1">{post.title}</h2>
            {post.description && (
              <p className="text-sm text-ink/60 leading-relaxed mb-3">{post.description}</p>
            )}

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map(t => (
                  <span key={t} className="badge-ink">#{t}</span>
                ))}
              </div>
            )}

            {post.style && <span className="badge-ochre capitalize">{post.style}</span>}
          </div>

          {/* Engagement */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => user ? likeMutation.mutate() : toast.error('Sign in to like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all border
                  ${post.likedByMe
                    ? 'bg-clay/10 border-clay/30 text-clay'
                    : 'border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink'}`}>
                <svg className="w-4 h-4" fill={post.likedByMe ? 'currentColor' : 'none'}
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                <span className="text-sm font-medium">{post.likeCount}</span>
              </button>

              <div className="flex items-center gap-2 text-ink/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <span className="text-sm">{post.views}</span>
              </div>
            </div>
          </div>

          {/* Owner controls */}
          {isOwner && (
            <div className="card p-5">
              <p className="section-label mb-3">Visibility</p>
              <div className="flex gap-2">
                <button onClick={() => visibilityMutation.mutate(true)}
                  className={`flex-1 py-2 text-sm rounded-sm border transition-all
                    ${post.isPublic ? 'bg-sage/10 border-sage/30 text-sage-700' : 'border-ink/15 text-ink/50 hover:border-ink/30'}`}>
                  Public
                </button>
                <button onClick={() => visibilityMutation.mutate(false)}
                  className={`flex-1 py-2 text-sm rounded-sm border transition-all
                    ${!post.isPublic ? 'bg-ink/10 border-ink/30 text-ink' : 'border-ink/15 text-ink/50 hover:border-ink/30'}`}>
                  Private
                </button>
              </div>
            </div>
          )}

          {/* Model info */}
          {post.restorationId && (
            <div className="card p-5">
              <p className="section-label mb-3">Restoration info</p>
              <div className="space-y-1.5 text-xs font-mono text-ink/50">
                {post.restorationId.mode && (
                  <p>Mode: <span className="text-ink/70">{post.restorationId.mode}</span></p>
                )}
                {post.restorationId.detectedDamageTypes?.length > 0 && (
                  <p>Damage: <span className="text-ink/70 capitalize">
                    {post.restorationId.detectedDamageTypes.join(', ')}
                  </span></p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
