import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Plus, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import ReviewSection from '../components/ReviewSection';
import MovieCarousel from '../components/MovieCarousel';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true);
        const [movieRes, watchlistRes, similarRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get('/watchlist'),
          api.get(`/catalog/similar/${id}`),
        ]);
        setMovie(movieRes.data);
        const ids = new Set(watchlistRes.data.map((item) => item.movieId));
        setWatchlistIds(ids);
        setInWatchlist(ids.has(Number(id)));
        setSimilar(
          similarRes.data.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            genre: m.genre,
            releaseYear: m.releaseYear,
            thumbnailUrl: m.thumbnailUrl,
            bannerUrl: m.bannerUrl,
            videoUrl: m.videoUrl,
            rating: m.rating,
            matchScore: m.matchScore,
            aiReason: m.reason,
          }))
        );
      } catch (err) {
        console.error('Failed to load movie details', err);
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id]);

  const toggleWatchlist = async () => {
    if (!movie) return;
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${movie.id}`);
        setInWatchlist(false);
        setWatchlistIds((prev) => {
          const n = new Set(prev);
          n.delete(movie.id);
          return n;
        });
      } else {
        await api.post(`/watchlist/${movie.id}`);
        setInWatchlist(true);
        setWatchlistIds((prev) => new Set(prev).add(movie.id));
      }
    } catch (err) {
      console.error('Watchlist update failed', err);
    }
  };

  if (loading) {
    return (
      <div className="details-loading">
        <div className="player-loading-bar" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!movie) {
    return <div className="details-loading">Movie not found</div>;
  }

  const banner = resolveMediaUrl(movie.bannerUrl || movie.thumbnailUrl);

  return (
    <div className="page-details">
      <Navbar />
      <div
        className="details-hero"
        style={{ backgroundImage: `linear-gradient(77deg, #000 25%, transparent), url(${banner})` }}
      >
        <div className="details-hero-content">
          <h1>{movie.title}</h1>
          <div className="details-meta">
            <span className="details-match">{Math.round((movie.rating || 7) * 10)}% Match</span>
            <span>{movie.releaseYear}</span>
            <span>{movie.genre}</span>
            <span>★ {movie.rating?.toFixed(1)}</span>
          </div>
          <p className="details-desc">{movie.description}</p>
          <div className="details-actions">
            <button type="button" className="btn-primary" onClick={() => navigate(`/watch/${movie.id}`)}>
              <Play size={20} fill="#fff" /> Play
            </button>
            <button type="button" className="btn-secondary" onClick={toggleWatchlist}>
              {inWatchlist ? <Check size={20} /> : <Plus size={20} />}
              {inWatchlist ? 'In My List' : 'My List'}
            </button>
          </div>
        </div>
      </div>

      <div className="details-body">
        {similar.length > 0 && (
          <MovieCarousel
            title="More Like This"
            subtitle="Content-based similarity (genre, year, rating)"
            movies={similar}
            watchlistIds={watchlistIds}
            onWatchlistChange={(mid, added) => {
              setWatchlistIds((prev) => {
                const n = new Set(prev);
                if (added) n.add(mid);
                else n.delete(mid);
                return n;
              });
            }}
            onCardClick={(mid) => navigate(`/movie/${mid}`)}
            showMatchScore
          />
        )}
        <ReviewSection movieId={id} />
      </div>
    </div>
  );
};

export default MovieDetails;
