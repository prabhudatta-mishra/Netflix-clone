import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play, Plus, Star } from 'lucide-react';
import api from '../api/axios';
import { resolveMediaUrl, trackRecommendationEvent } from '../api/media';

const fallbackThumb = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600';

const MovieCard = ({ movie, isWatchlistItem, onWatchlistChange, onCardClick, showMatchScore }) => {
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(isWatchlistItem);
  const [loading, setLoading] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setInWatchlist(isWatchlistItem);
    setThumbFailed(false);
  }, [isWatchlistItem]);

  const toggleWatchlist = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${movie.id}`);
        setInWatchlist(false);
        onWatchlistChange?.(movie.id, false);
      } else {
        await api.post(`/watchlist/${movie.id}`);
        setInWatchlist(true);
        onWatchlistChange?.(movie.id, true);
      }
    } catch (err) {
      console.error('Watchlist modification failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    trackRecommendationEvent(api, { movieId: movie.id, eventType: 'PLAY', context: 'movie-card' });
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div
      className="movie-card animate-fade-in"
      onClick={() => {
        trackRecommendationEvent(api, { movieId: movie.id, eventType: 'CLICK', context: 'movie-card' });
        onCardClick?.(movie.id);
      }}
    >
      <div className="movie-card-thumb">
        {!thumbFailed && (
          <img
            className="movie-card-img"
            src={resolveMediaUrl(movie.thumbnailUrl) || fallbackThumb}
            alt=""
            onError={() => setThumbFailed(true)}
          />
        )}
        {thumbFailed && (
          <div className="movie-card-fallback" aria-hidden="true">
            <span>{getInitials(movie.title)}</span>
          </div>
        )}
        <div className="movie-card-overlay">
          <button type="button" className="movie-play-btn" onClick={handlePlayClick} aria-label={`Play ${movie.title}`}>
            <Play size={24} />
          </button>
        </div>

        <div className="movie-hover-preview">
          {showMatchScore && movie.matchScore != null && (
            <span className="match-badge">{Math.round(movie.matchScore)}% Match</span>
          )}
          <h4>{movie.title}</h4>
          <p>{movie.description ? `${movie.description.slice(0, 90)}...` : 'Ready to stream.'}</p>
          {movie.aiReason && <span className="preview-reason">{movie.aiReason}</span>}
          <span className="preview-genre">{movie.genre}</span>
          <span className="preview-rating">Rating {formatRating(movie.rating)}</span>
        </div>
      </div>

      <div className="movie-card-body">
        <div>
          <h3 className="movie-card-title">{movie.title}</h3>
          <div className="movie-card-meta">
            {movie.releaseYear && <span className="movie-card-year">{movie.releaseYear}</span>}
            {movie.releaseYear && movie.genre && <span>/</span>}
            {movie.genre && <span className="movie-card-genre">{movie.genre}</span>}
          </div>
        </div>

        <div className="movie-card-footer">
          <div className="movie-card-rating">
            <Star size={14} fill="#ffc107" />
            <span>{formatRating(movie.rating)}</span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={toggleWatchlist}
            className={`movie-list-toggle ${inWatchlist ? 'is-saved' : ''}`}
            aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
          >
            {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const formatRating = (rating) => {
  const value = Number(rating);
  return Number.isFinite(value) ? value.toFixed(1) : '7.5';
};

const getInitials = (title = '') => {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'N';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

export default MovieCard;
