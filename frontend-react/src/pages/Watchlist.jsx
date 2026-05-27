import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import api from '../api/axios';
import { Bookmark, Film } from 'lucide-react';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal UI State
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/watchlist');
      // Map WatchlistResponse back to Movie structure so we can reuse MovieCard cleanly
      const moviesData = response.data.map(item => ({
        id: item.movieId,
        title: item.title,
        genre: item.genre,
        thumbnailUrl: item.thumbnailUrl,
        videoUrl: item.videoUrl,
        rating: item.rating
      }));
      setWatchlist(moviesData);
      setWatchlistIds(new Set(moviesData.map(m => m.id)));
    } catch (err) {
      console.error('Error fetching watchlist', err);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistChange = (movieId, isAdded) => {
    // Since we're in the watchlist page, if a movie is un-saved, remove it from view
    if (!isAdded) {
      setWatchlist(prev => prev.filter(m => m.id !== movieId));
      setWatchlistIds(prev => {
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-black)', paddingBottom: '3rem' }}>
      <Navbar />
      
      <div style={{ padding: '120px 4% 0 4%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Bookmark size={28} color="var(--netflix-red)" fill="var(--netflix-red)" />
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>My Watchlist</h1>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            fontSize: '1.2rem',
            color: 'var(--text-gray)'
          }}>
            Fetching your watchlist...
          </div>
        ) : error ? (
          <div style={{ color: 'var(--netflix-red)', textAlign: 'center', padding: '40px' }}>
            {error}
          </div>
        ) : watchlist.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40vh',
            gap: '1rem',
            color: '#666',
            textAlign: 'center'
          }}>
            <Film size={48} />
            <h3 style={{ color: '#aaa' }}>Your watchlist is empty</h3>
            <p style={{ fontSize: '0.95rem', maxWidth: '400px' }}>
              Explore the homepage, search for movies, and click the "+" icon to add them to your watchlist.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '24px'
          }}>
            {watchlist.map(movie => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                isWatchlistItem={true}
                onWatchlistChange={handleWatchlistChange}
                onCardClick={(id) => setSelectedMovieId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Movie Detail Modal Overlay */}
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

export default Watchlist;
