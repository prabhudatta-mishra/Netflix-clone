import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Plus, Check, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import api from '../api/axios';
import { resolveMediaUrl, trackRecommendationEvent } from '../api/media';
import { useToast } from '../context/ToastContext';

const MovieModal = ({ movieId, onClose, onWatchlistChange, watchlistIds }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        // Fetch specific movie details
        const response = await api.get(`/movies/${movieId}`);
        const movieData = response.data;
        setMovie(movieData);
        setInWatchlist(watchlistIds.has(movieData.id));
        setFeedback('');

        // Fetch recommendations (movies of the same genre, excluding current)
        const genreResponse = await api.get(`/movies/genre/${movieData.genre}`);
        const filtered = genreResponse.data.filter(m => m.id !== movieData.id);
        setRecommendations(filtered.slice(0, 4)); // Show top 4
      } catch (err) {
        console.error('Error loading movie details in modal', err);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieData();
    }
  }, [movieId, watchlistIds]);

  const toggleWatchlist = async () => {
    if (!movie || watchlistLoading) return;
    setWatchlistLoading(true);
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
      console.error('Watchlist modification failed in modal', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const sendFeedback = async (eventType) => {
    if (!movie) return;
    try {
      await trackRecommendationEvent(api, { movieId: movie.id, eventType, context: 'movie-modal' });
      setFeedback(eventType);
      toast?.success?.(eventType === 'LIKE' ? 'Like sent to admin' : 'Dislike sent to admin');
    } catch (err) {
      console.error('Feedback event failed', err);
      toast?.error?.('Feedback not saved. Please login again or restart backend.');
    }
  };

  if (!movieId) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto',
        zIndex: 2000,
        padding: '40px 20px',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '850px',
          backgroundColor: '#181818',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          position: 'relative',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(20, 20, 20, 0.85)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            zIndex: 10,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>
            Loading movie information...
          </div>
        ) : movie ? (
          <div>
            {/* Modal Billboard Image */}
            <div 
              style={{
                height: '400px',
                width: '100%',
                backgroundImage: `linear-gradient(to top, #181818 0%, rgba(24,24,24,0.4) 60%, rgba(24,24,24,0) 100%), url(${resolveMediaUrl(movie.thumbnailUrl) || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '40px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                <h1 style={{
                  fontSize: '2.8rem',
                  fontWeight: '800',
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  fontFamily: 'var(--font-display)'
                }}>{movie.title}</h1>

                <div className="modal-action-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button 
                    onClick={() => navigate(`/watch/${movie.id}`)}
                    className="btn-primary"
                    style={{ padding: '0.7rem 2rem', fontSize: '1.05rem' }}
                  >
                    <Play size={18} fill="#fff" />
                    Play
                  </button>

                  <button 
                    onClick={toggleWatchlist}
                    disabled={watchlistLoading}
                    className="btn-secondary"
                    style={{
                      padding: '0 1.05rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '999px',
                      minWidth: '112px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#fff',
                      fontWeight: 800
                    }}
                  >
                    {inWatchlist ? <Check size={20} color="#46d369" /> : <Plus size={20} />}
                    {inWatchlist ? 'Saved' : 'My List'}
                  </button>

                  <button
                    type="button"
                    onClick={() => sendFeedback('LIKE')}
                    title="Improve recommendations"
                    aria-label="Like this movie"
                    style={{
                      ...modalFeedbackButtonStyle,
                      ...(feedback === 'LIKE' ? modalFeedbackActiveStyle : {}),
                    }}
                  >
                    <ThumbsUp size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={() => sendFeedback('DISLIKE')}
                    title="Show less like this"
                    aria-label="Not for me"
                    style={{
                      ...modalFeedbackButtonStyle,
                      ...(feedback === 'DISLIKE' ? modalFeedbackActiveStyle : {}),
                    }}
                  >
                    <ThumbsDown size={19} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Details Grid */}
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div className="modal-details-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                {/* Left side: desc */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
                    <span style={{ color: '#46d369', fontWeight: '700' }}>{movie.releaseYear}</span>
                    <span>•</span>
                    <span style={{
                      border: '1px solid rgba(255,255,255,0.4)',
                      padding: '1px 6px',
                      fontSize: '0.75rem',
                      borderRadius: '3px'
                    }}>HD</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffc107' }}>
                      <Star size={14} fill="#ffc107" />
                      {movie.rating}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '1.05rem',
                    lineHeight: '1.6',
                    color: '#ddd'
                  }}>{movie.description}</p>
                </div>

                {/* Right side: metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem', color: '#aaa' }}>
                  <div>
                    <span style={{ color: '#666' }}>Genre: </span>
                    <span style={{ color: '#fff' }}>{movie.genre}</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>Status: </span>
                    <span style={{ color: '#fff' }}>Available to stream</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>Audio: </span>
                    <span style={{ color: '#fff' }}>Dolby Atmos 5.1</span>
                  </div>
                </div>
              </div>

              {/* Recommendations "More Like This" */}
              {recommendations.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    marginBottom: '20px',
                    fontFamily: 'var(--font-display)'
                  }}>More Like This</h3>

                  <div className="modal-recommendation-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px'
                  }}>
                    {recommendations.map(rec => (
                      <div 
                        key={rec.id}
                        onClick={() => {
                          // Change the active movie detail in the modal smoothly
                          setMovie(null);
                          setRecommendations([]);
                          setLoading(true);
                          // This triggers the useEffect since movieId changes
                          // Wait, we can navigate or just call local load
                          // Let's set it by executing another load manually
                          setMovie(rec);
                          setInWatchlist(watchlistIds.has(rec.id));
                          // Update recommendations for new rec
                          api.get(`/movies/genre/${rec.genre}`).then(res => {
                            setRecommendations(res.data.filter(m => m.id !== rec.id).slice(0, 4));
                            setLoading(false);
                          });
                        }}
                        style={{
                          background: '#2f2f2f',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '280px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div style={{
                          height: '150px',
                          backgroundImage: `url(${rec.thumbnailUrl || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#ffc107'
                          }}>
                            Rating {rec.rating}
                          </div>
                        </div>

                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{rec.title}</h4>
                            <p style={{
                              fontSize: '0.8rem',
                              color: '#bbb',
                              marginTop: '4px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>{rec.description}</p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#999' }}>
                            <span>{rec.releaseYear}</span>
                            <span style={{
                              background: 'rgba(229, 9, 20, 0.1)',
                              color: 'var(--netflix-red)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>Play</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>
            Movie not found.
          </div>
        )}
      </div>
    </div>
  );
};

const modalFeedbackButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.5)',
  background: 'rgba(255,255,255,0.1)',
  color: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const modalFeedbackActiveStyle = {
  borderColor: 'var(--netflix-red)',
  background: 'rgba(229,9,20,0.38)',
};

export default MovieModal;


