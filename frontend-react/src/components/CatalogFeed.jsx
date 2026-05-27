import React from 'react';
import { Sparkles, TrendingUp, Star, Film } from 'lucide-react';
import MovieCarousel from './MovieCarousel';

const ROW_ICONS = {
  'top-picks': Sparkles,
  trending: TrendingUp,
  'top-rated': Star,
  'new-releases': Film,
};

const CatalogFeed = ({ rows, watchlistIds, onWatchlistChange, onCardClick }) => {
  if (!rows?.length) return null;

  return (
    <>
      {rows.map((row) => {
        const Icon = ROW_ICONS[row.rowId] || Film;
        const movies = row.movies.map((m) => ({
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
        }));

        return (
          <div key={row.rowId} className="catalog-row-wrap">
            <MovieCarousel
              title={
                <span className="catalog-row-title">
                  <Icon size={20} className="catalog-row-icon" />
                  {row.title}
                </span>
              }
              subtitle={row.algorithm}
              movies={movies}
              watchlistIds={watchlistIds}
              onWatchlistChange={onWatchlistChange}
              onCardClick={onCardClick}
              showMatchScore={row.rowId === 'top-picks' || row.rowId === 'watchers-also'}
            />
          </div>
        );
      })}
    </>
  );
};

export default CatalogFeed;
