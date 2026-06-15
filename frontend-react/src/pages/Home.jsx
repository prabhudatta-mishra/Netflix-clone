import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import CatalogFeed from '../components/CatalogFeed';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { SkeletonHero, SkeletonRow } from '../components/SkeletonLoader';
import api from '../api/axios';
import { trackRecommendationEvent } from '../api/media';
import { useToast } from '../context/ToastContext';

const Home = () => {
  const toast = useToast();
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [catalogRows, setCatalogRows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortMode, setSortMode] = useState('relevance');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [catalogRes, moviesRes, watchlistRes] = await Promise.all([
          api.get('/catalog/home'),
          api.get('/movies'),
          api.get('/watchlist'),
        ]);
        const catalog = catalogRes.data;
        setCatalogRows(catalog.rows || []);
        const featured = catalog.featured;
        if (featured) {
          setFeaturedMovie({
            id: featured.id,
            title: featured.title,
            description: featured.description,
            genre: featured.genre,
            releaseYear: featured.releaseYear,
            thumbnailUrl: featured.thumbnailUrl,
            bannerUrl: featured.bannerUrl,
            videoUrl: featured.videoUrl,
            rating: featured.rating,
          });
        }
        const moviesData = moviesRes.data;
        setMovies(moviesData);
        setFilteredMovies(moviesData);
        setWatchlistIds(new Set(watchlistRes.data.map((item) => item.movieId)));
      } catch (err) {
        console.error('Dashboard load failed', err);
        setError('Cannot reach backend. Start backend on port 8080 and open http://localhost:3000');
        toast?.error?.('Failed to load catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredMovies(movies);
      setSelectedGenre('All');
      setSortMode('relevance');
      return;
    }
    try {
      trackRecommendationEvent(api, { eventType: 'SEARCH', queryText: query, context: 'navbar' }).catch(() => {});
      const res = await api.get(`/recommendations/search?q=${encodeURIComponent(query)}&limit=30`);
      setFilteredMovies(res.data);
    } catch {
      try {
        const res = await api.get(`/movies/search?title=${encodeURIComponent(query)}`);
        setFilteredMovies(res.data);
      } catch {
        const lower = query.toLowerCase();
        setFilteredMovies(
          movies.filter(
            (m) =>
              m.title?.toLowerCase().includes(lower) ||
              m.genre?.toLowerCase().includes(lower) ||
              m.description?.toLowerCase().includes(lower)
          )
        );
      }
    }
  };

  const handleWatchlistChange = (movieId, isAdded) => {
    trackRecommendationEvent(api, { movieId, eventType: isAdded ? 'ADD_TO_LIST' : 'REMOVE_FROM_LIST', context: 'home' }).catch(() => {});
    setWatchlistIds((prev) => {
      const updated = new Set(prev);
      if (isAdded) updated.add(movieId);
      else updated.delete(movieId);
      return updated;
    });
    toast?.success?.(isAdded ? 'Added to My List' : 'Removed from My List');
  };

  const isSearchMode = searchQuery.trim().length > 0;
  const genreOptions = useMemo(() => {
    const genres = movies.map((movie) => movie.genre).filter(Boolean);
    return ['All', ...Array.from(new Set(genres)).sort((a, b) => a.localeCompare(b))];
  }, [movies]);

  const visibleMovies = useMemo(() => {
    const byGenre = selectedGenre === 'All'
      ? filteredMovies
      : filteredMovies.filter((movie) => movie.genre === selectedGenre);
    const sorted = [...byGenre];
    if (sortMode === 'rating') {
      sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortMode === 'newest') {
      sorted.sort((a, b) => Number(b.releaseYear || 0) - Number(a.releaseYear || 0));
    } else if (sortMode === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return sorted;
  }, [filteredMovies, selectedGenre, sortMode]);

  const selectGenre = (genre) => {
    setSelectedGenre(genre);
    if (genre !== 'All') {
      trackRecommendationEvent(api, { eventType: 'FILTER_GENRE', queryText: genre, context: 'home-search' }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="page-home">
        <Navbar />
        <SkeletonHero />
        <div style={{ padding: '0 4%' }}>
          <SkeletonRow count={6} />
          <SkeletonRow count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-home">
        <Navbar />
        <div className="error-panel">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-home">
      <Navbar onSearch={handleSearch} />

      {!isSearchMode && featuredMovie && (
        <HeroBanner
          movie={featuredMovie}
          watchlistIds={watchlistIds}
          onWatchlistChange={handleWatchlistChange}
        />
      )}

      <div className={`home-content ${featuredMovie && !isSearchMode ? 'with-hero' : 'no-hero'}`}>
        {isSearchMode ? (
          <section>
            <h2 className="section-title">Search Results</h2>
            <p className="carousel-subtitle" style={{ padding: '0 4%', marginTop: -8 }}>
              Ranked by title, genre, description, rating, and your watch behavior.
            </p>
            <div style={browseControlsStyle}>
              <div style={genreChipsStyle}>
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => selectGenre(genre)}
                    style={selectedGenre === genre ? activeGenreChipStyle : genreChipStyle}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <label style={sortLabelStyle}>
                Sort
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={sortSelectStyle}>
                  <option value="relevance">Relevance</option>
                  <option value="rating">Top rated</option>
                  <option value="newest">Newest</option>
                  <option value="title">A-Z</option>
                </select>
              </label>
            </div>
            {visibleMovies.length === 0 ? (
              <p className="empty-text">No movies found for &quot;{searchQuery}&quot;</p>
            ) : (
              <div className="search-grid">
                {visibleMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isWatchlistItem={watchlistIds.has(movie.id)}
                    onWatchlistChange={handleWatchlistChange}
                    onCardClick={setSelectedMovieId}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <ContinueWatchingRow />
            <CatalogFeed
              rows={catalogRows}
              watchlistIds={watchlistIds}
              onWatchlistChange={handleWatchlistChange}
              onCardClick={setSelectedMovieId}
            />
          </>
        )}
      </div>

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

const browseControlsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'center',
  padding: '12px 4% 18px',
  flexWrap: 'wrap',
};
const genreChipsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', minWidth: 0 };
const genreChipStyle = {
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.08)',
  color: '#e8e8e8',
  borderRadius: 999,
  padding: '8px 12px',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer',
};
const activeGenreChipStyle = {
  ...genreChipStyle,
  borderColor: 'var(--netflix-red)',
  background: 'rgba(229,9,20,0.22)',
  color: '#fff',
};
const sortLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: '#9f9f9f',
  fontSize: '0.82rem',
  fontWeight: 800,
};
const sortSelectStyle = {
  minHeight: 36,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.18)',
  background: '#141414',
  color: '#fff',
  padding: '0 10px',
  outline: 0,
};

export default Home;
