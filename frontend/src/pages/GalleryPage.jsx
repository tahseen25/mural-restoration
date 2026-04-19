// src/pages/GalleryPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';

const SORTS = [
  { value: 'newest',  label: 'Newest' },
  { value: 'popular', label: 'Most liked' },
  { value: 'views',   label: 'Most viewed' },
];

const STYLES = [
  'All','gond painting','kalighat painting','kangra painting','kerala mural',
  'madhubani painting','mandana art drawing','pichwai painting','warli painting',
];

export default function GalleryPage() {
  const { user } = useAuthStore();
  const [page, setPage]     = useState(1);
  const [sort, setSort]     = useState('newest');
  const [style, setStyle]   = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', page, sort, style, search],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 12, sort });
      if (style)  params.set('style', style);
      if (search) params.set('search', search);
      return api.get(`/gallery?${params}`).then(r => r.data);
    },
    keepPreviousData: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Community</p>
        <h1 className="font-display text-3xl font-bold text-ink mb-4">Mural gallery</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <input
            className="input flex-1"
            placeholder="Search murals…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-1 bg-ink/5 rounded-sm p-1">
          {SORTS.map(s => (
            <button key={s.value} onClick={() => { setSort(s.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all
                ${sort === s.value ? 'bg-white shadow-warm text-ink' : 'text-ink/50 hover:text-ink'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {STYLES.map(s => {
            const val = s === 'All' ? '' : s;
            return (
              <button key={s} onClick={() => { setStyle(val); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border capitalize
                  ${style === val
                    ? 'bg-ochre border-ochre text-cream'
                    : 'border-ink/15 text-ink/50 hover:border-ink/30 hover:text-ink'}`}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="aspect-square animate-shimmer rounded-t-sm" />
              <div className="p-4 space-y-2">
                <div className="h-4 animate-shimmer rounded" />
                <div className="h-3 w-2/3 animate-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && data?.posts?.length === 0 && (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-4 opacity-20">◉</div>
          <h3 className="font-display text-xl font-semibold text-ink mb-2">No posts yet</h3>
          <p className="text-ink/50 text-sm">
            {search || style ? 'Try different filters.' : 'Be the first to share a restored mural.'}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.posts?.map((post, i) => (
          <motion.div key={post._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}>
            <GalleryCard post={post} currentUserId={user?._id} />
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">← Prev</button>
          <span className="text-sm text-ink/50 font-mono">{page} / {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}

function GalleryCard({ post }) {
  return (
    <Link to={`/gallery/${post._id}`} className="card-hover block group">
      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-t-sm bg-ink/5">
        <img
          src={`/api/restorations/${post.restorationId?._id || post.restorationId}/restored?size=256`}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-medium text-ink text-sm truncate mb-1">{post.title}</p>
        {post.style && (
          <p className="text-xs text-ink/40 capitalize mb-2">{post.style}</p>
        )}

        {/* Author + engagement */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {post.userId?.avatar
              ? <img src={post.userId.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
              : <div className="w-5 h-5 rounded-full bg-ochre/20 flex items-center justify-center text-xs text-ochre">
                  {post.userId?.name?.[0]}
                </div>
            }
            <span className="text-xs text-ink/50 truncate max-w-[80px]">{post.userId?.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill={post.likedByMe ? 'currentColor' : 'none'}
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              {post.commentCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
