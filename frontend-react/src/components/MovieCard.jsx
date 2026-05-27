import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Star } from 'lucide-react';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';

const MovieCard = ({ movie, isWatchlistItem, onWatchlistChange, onCardClick, showMatchScore }) => {
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(isWatchlistItem);
  const [loading, setLoading] = useState(false);

  // Sync state with parent watchlist changes (e.g. if modified in modal)
  useEffect(() => {
    setInWatchlist(isWatchlistItem);
  }, [isWatchlistItem]);

  const toggleWatchlist = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${movie.id}`);
        setInWatchlist(false);
        if (onWatchlistChange) onWatchlistChange(movie.id, false);
      } else {
        await api.post(`/watchlist/${movie.id}`);
        setInWatchlist(true);
        if (onWatchlistChange) onWatchlistChange(movie.id, true);
      }
    } catch (err) {
      console.error('Watchlist modification failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Avoid triggering card modal on play icon click
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div 
      className="movie-card animate-fade-in"
      onClick={() => onCardClick && onCardClick(movie.id)}
    >
      {/* Movie Thumbnail */}
      <div 
        className="movie-card-thumb"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(20,20,20,0.95) 100%), url(${resolveMediaUrl(movie.thumbnailUrl) || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600'})`,
        }}
      >
        <div className="movie-card-overlay">
          <div className="movie-play-btn" onClick={handlePlayClick}>
            <Play size={24} color="#fff" fill="#fff" />
          </div>
        </div>
        <div className="movie-hover-preview">
          {showMatchScore && movie.matchScore != null && (
            <span className="match-badge">{Math.round(movie.matchScore)}% Match</span>
          )}
          <h4>{movie.title}</h4>
          <p>{movie.description?.slice(0, 90)}...</p>
          {movie.aiReason && <span className="preview-reason">{movie.aiReason}</span>}
          <span className="preview-genre">{movie.genre}</span>
          <span className="preview-rating">★ {movie.rating}</span>
        </div>
      </div>

      {/* Movie Details Info */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexGrow: 1,
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{movie.title}</h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
            fontSize: '0.8rem',
            color: 'var(--text-gray)'
          }}>
            <span style={{ color: '#46d369', fontWeight: '600' }}>{movie.releaseYear}</span>
            <span>•</span>
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>{movie.genre}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px'
        }}>
          {/* Play CTA & Star Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffc107', fontSize: '0.85rem' }}>
            <Star size={14} fill="#ffc107" />
            <span style={{ fontWeight: '600', color: '#e5e5e5' }}>{movie.rating?.toFixed(1) || '7.5'}</span>
          </div>

          {/* Add / Remove from Watchlist Toggle CTA */}
          <button 
            disabled={loading}
            onClick={toggleWatchlist}
            style={{
              background: inWatchlist ? 'rgba(70, 211, 105, 0.2)' : 'rgba(255,255,255,0.1)',
              border: inWatchlist ? '1px solid #46d369' : '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: inWatchlist ? '#46d369' : '#fff',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if(!inWatchlist) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              if(!inWatchlist) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
