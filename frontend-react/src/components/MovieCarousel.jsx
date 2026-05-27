import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieCarousel = ({ title, subtitle, movies, watchlistIds, onWatchlistChange, onCardClick, showMatchScore }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="carousel-section">
      <div className="carousel-header">
        <div className="carousel-header-text">
          <h2 className="carousel-title">{title}</h2>
          {subtitle && <p className="carousel-subtitle">{subtitle}</p>}
        </div>
        <div className="carousel-controls">
          <button type="button" className="carousel-btn" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className="carousel-btn" onClick={() => scroll('right')} aria-label="Scroll right">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
      <div className="carousel-track" ref={rowRef}>
        {movies.map((movie) => (
          <div key={movie.id} className="carousel-item">
            <MovieCard
              movie={movie}
              isWatchlistItem={watchlistIds.has(movie.id)}
              onWatchlistChange={onWatchlistChange}
              onCardClick={onCardClick}
              showMatchScore={showMatchScore}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default MovieCarousel;
