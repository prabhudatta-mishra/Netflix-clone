import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Film, Play, Search, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import MovieModal from '../components/MovieModal';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';

const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/watchlist');
      const moviesData = response.data.map((item) => ({
        id: item.movieId,
        title: item.title,
        genre: item.genre,
        thumbnailUrl: item.thumbnailUrl,
        videoUrl: item.videoUrl,
        rating: item.rating,
      }));
      setWatchlist(moviesData);
      setWatchlistIds(new Set(moviesData.map((m) => m.id)));
    } catch (err) {
      console.error('Error fetching watchlist', err);
      setError('Failed to load My List.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return watchlist;
    return watchlist.filter((movie) =>
      [movie.title, movie.genre].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    );
  }, [query, watchlist]);

  const removeMovie = async (movieId) => {
    try {
      await api.delete(`/watchlist/${movieId}`);
      handleWatchlistChange(movieId, false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove movie from My List.');
    }
  };

  const handleWatchlistChange = (movieId, isAdded) => {
    if (!isAdded) {
      setWatchlist((prev) => prev.filter((m) => m.id !== movieId));
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        next.delete(movieId);
        return next;
      });
      if (selectedMovieId === movieId) {
        setSelectedMovieId(null);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-black)', paddingBottom: '4rem' }}>
      <Navbar />

      <main style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Saved for later</p>
            <h1 style={titleStyle}>My List</h1>
            <p style={subtitleStyle}>{watchlist.length} saved title(s). Keep favorites ready for the next watch.</p>
          </div>
          <div style={searchBoxStyle}>
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search My List" style={searchInputStyle} />
          </div>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <div style={loadingStyle}>Fetching your list...</div>
        ) : watchlist.length === 0 ? (
          <EmptyState />
        ) : (
          <section style={gridStyle}>
            {filtered.map((movie) => (
              <article key={movie.id} style={cardStyle}>
                <button type="button" onClick={() => setSelectedMovieId(movie.id)} style={posterButtonStyle}>
                  <img src={resolveMediaUrl(movie.thumbnailUrl)} alt="" style={posterStyle} />
                  <span style={posterOverlayStyle}><Play size={28} fill="#fff" /></span>
                </button>
                <div style={cardBodyStyle}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={movieTitleStyle}>{movie.title}</h2>
                    <p style={movieMetaStyle}>{movie.genre || 'Movie'} - Rating {formatRating(movie.rating)}</p>
                  </div>
                  <div style={actionRowStyle}>
                    <button type="button" className="btn-primary" style={smallActionStyle} onClick={() => navigate(`/watch/${movie.id}`)}>
                      <Play size={16} />
                      Play
                    </button>
                    <button type="button" title="Remove from My List" style={removeButtonStyle} onClick={() => removeMovie(movie.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {selectedMovieId && (
        <MovieModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
          onWatchlistChange={handleWatchlistChange}
          watchlistIds={watchlistIds}
        />
      )}
    </div>
  );
};

const EmptyState = () => (
  <div style={emptyStyle}>
    <Film size={48} />
    <h2 style={{ margin: 0 }}>Your list is empty</h2>
    <p style={{ color: '#8f8f8f', margin: 0, maxWidth: 420 }}>Browse movies and save titles with the plus button. They will appear here instantly.</p>
  </div>
);

const formatRating = (rating) => Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : 'N/A';

const pageStyle = { padding: '104px 4% 0', maxWidth: 1280, margin: '0 auto' };
const heroStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap' };
const eyebrowStyle = { color: 'var(--netflix-red)', textTransform: 'uppercase', fontSize: '0.76rem', fontWeight: 900, margin: '0 0 8px' };
const titleStyle = { fontSize: '2.6rem', lineHeight: 1, margin: 0, fontWeight: 900 };
const subtitleStyle = { color: '#9a9a9a', margin: '10px 0 0' };
const searchBoxStyle = { display: 'flex', alignItems: 'center', gap: 10, background: '#111', border: '1px solid #2b2b2b', borderRadius: 6, padding: '11px 13px', minWidth: 280, color: '#aaa' };
const searchInputStyle = { background: 'transparent', border: 0, outline: 0, color: '#fff', fontSize: '0.95rem', width: '100%' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 };
const cardStyle = { background: '#111', border: '1px solid #252525', borderRadius: 8, overflow: 'hidden' };
const posterButtonStyle = { position: 'relative', display: 'block', width: '100%', aspectRatio: '16 / 9', border: 0, padding: 0, background: '#1a1a1a', cursor: 'pointer' };
const posterStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const posterOverlayStyle = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.18)', color: '#fff' };
const cardBodyStyle = { padding: 13, display: 'grid', gap: 12 };
const movieTitleStyle = { margin: 0, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const movieMetaStyle = { margin: '5px 0 0', color: '#888', fontSize: '0.84rem' };
const actionRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' };
const smallActionStyle = { height: 36, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7 };
const removeButtonStyle = { width: 36, height: 36, borderRadius: 6, border: '1px solid #333', background: '#191919', color: 'var(--netflix-red)', display: 'grid', placeItems: 'center', cursor: 'pointer' };
const loadingStyle = { minHeight: 360, display: 'grid', placeItems: 'center', color: '#999' };
const errorStyle = { background: 'rgba(229,9,20,0.14)', border: '1px solid rgba(229,9,20,0.45)', color: '#fff', borderRadius: 6, padding: 13, marginBottom: 18 };
const emptyStyle = { minHeight: 400, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 12, textAlign: 'center', color: '#777', border: '1px dashed #333', borderRadius: 8 };

export default Watchlist;
