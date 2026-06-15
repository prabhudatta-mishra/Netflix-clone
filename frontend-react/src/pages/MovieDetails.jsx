import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Check, Clock3, Languages, Play, Plus, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import ReviewSection from '../components/ReviewSection';
import MovieCarousel from '../components/MovieCarousel';
import api from '../api/axios';
import { resolveMediaUrl, trackRecommendationEvent } from '../api/media';
import { useToast } from '../context/ToastContext';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [feedback, setFeedback] = useState('');
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

  const sendFeedback = async (eventType) => {
    if (!movie) return;
    try {
      await trackRecommendationEvent(api, { movieId: movie.id, eventType, context: 'movie-details' });
      setFeedback(eventType);
      toast?.success?.(eventType === 'LIKE' ? 'Like sent to admin' : 'Dislike sent to admin');
    } catch (err) {
      console.error('Feedback event failed', err);
      toast?.error?.('Feedback not saved. Please login again or restart backend.');
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
            <button
              type="button"
              className="btn-secondary"
              title="Improve recommendations"
              onClick={() => sendFeedback('LIKE')}
              style={feedback === 'LIKE' ? activeFeedbackButtonStyle : undefined}
            >
              <ThumbsUp size={19} />
              Like
            </button>
            <button
              type="button"
              className="btn-secondary"
              title="Show less like this"
              onClick={() => sendFeedback('DISLIKE')}
              style={feedback === 'DISLIKE' ? activeFeedbackButtonStyle : undefined}
            >
              <ThumbsDown size={19} />
              Not for me
            </button>
          </div>
        </div>
      </div>

      <div className="details-body">
        <section style={detailsInfoGridStyle}>
          <InfoTile icon={<Clock3 size={19} />} label="Runtime" value={runtimeLabel(movie)} />
          <InfoTile icon={<Languages size={19} />} label="Audio" value={audioLabel(movie)} />
          <InfoTile icon={<BadgeCheck size={19} />} label="Playback" value={playbackLabel(movie)} />
          <InfoTile icon={<Sparkles size={19} />} label="Why this fits" value={similar[0]?.aiReason || `Because you watched ${movie.genre || 'similar'} titles`} />
        </section>

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

const InfoTile = ({ icon, label, value }) => (
  <div style={infoTileStyle}>
    <span style={infoIconStyle}>{icon}</span>
    <span style={{ minWidth: 0 }}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value}</span>
    </span>
  </div>
);

const runtimeLabel = (movie) => movie.duration || movie.runtime || 'Full movie';
const audioLabel = (movie) => movie.videoUrl?.includes('/uploads/') ? 'Local MP4 audio' : 'Stream audio';
const playbackLabel = (movie) => {
  if (movie.videoUrl?.startsWith('/uploads/')) return 'Local file';
  if (movie.videoUrl?.includes('commondatastorage.googleapis.com')) return 'Demo fallback';
  if (movie.videoUrl) return 'External stream';
  return 'Needs MP4';
};

const activeFeedbackButtonStyle = { borderColor: 'var(--netflix-red)', background: 'rgba(229,9,20,0.28)' };
const detailsInfoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 24,
};
const infoTileStyle = {
  display: 'flex',
  gap: 11,
  alignItems: 'center',
  background: '#111',
  border: '1px solid #282828',
  borderRadius: 8,
  padding: 14,
  minWidth: 0,
};
const infoIconStyle = { color: 'var(--netflix-red)', display: 'flex', flexShrink: 0 };
const infoLabelStyle = {
  display: 'block',
  color: '#8f8f8f',
  fontSize: '0.74rem',
  fontWeight: 800,
  textTransform: 'uppercase',
};
const infoValueStyle = {
  display: 'block',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 800,
  marginTop: 3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default MovieDetails;
