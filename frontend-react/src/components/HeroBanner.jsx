import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Info } from 'lucide-react';
import api from '../api/axios';
import { resolveMediaUrl, resolveVideoUrl } from '../api/media';

const HeroBanner = ({ movie, watchlistIds, onWatchlistChange }) => {
  const navigate = useNavigate();
  const [playPreview, setPlayPreview] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!movie) return undefined;
    setPlayPreview(false);
    const timer = setTimeout(() => setPlayPreview(true), 2500);
    return () => clearTimeout(timer);
  }, [movie]);

  if (!movie) return null;

  const inWatchlist = watchlistIds.has(movie.id);
  const bannerImage = movie.bannerUrl || movie.thumbnailUrl;

  const toggleWatchlist = async () => {
    setToggling(true);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${movie.id}`);
        onWatchlistChange(movie.id, false);
      } else {
        await api.post(`/watchlist/${movie.id}`);
        onWatchlistChange(movie.id, true);
      }
    } catch (err) {
      console.error('Watchlist toggle failed', err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="hero-banner">
      {playPreview && movie.videoUrl ? (
        <video
          className="hero-media"
          src={resolveVideoUrl(movie)}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <div
          className="hero-media hero-image"
          style={{ backgroundImage: `url(${resolveMediaUrl(bannerImage)})` }}
        />
      )}
      <div className="hero-gradient" />
      <div className="hero-content">
        <span className="hero-badge">FEATURED</span>
        <h1 className="hero-title">{movie.title}</h1>
        <p className="hero-description">{movie.description}</p>
        <div className="hero-meta">
          <span className="hero-year">{movie.releaseYear}</span>
          <span>•</span>
          <span>{movie.genre}</span>
          <span>•</span>
          <span className="hero-rating">★ {movie.rating}</span>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn-primary hero-btn-play" onClick={() => navigate(`/watch/${movie.id}`)}>
            <Play size={20} fill="#fff" /> Play
          </button>
          <button type="button" className="btn-secondary hero-btn-list" onClick={toggleWatchlist} disabled={toggling}>
            {inWatchlist ? <Check size={20} /> : <Plus size={20} />}
            {inWatchlist ? 'In My List' : 'My List'}
          </button>
          <button type="button" className="btn-secondary hero-btn-info" onClick={() => navigate(`/movie/${movie.id}`)} aria-label="More info">
            <Info size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
