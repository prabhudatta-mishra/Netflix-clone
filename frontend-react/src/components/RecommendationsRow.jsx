import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../api/axios';
import MovieCarousel from './MovieCarousel';

const RecommendationsRow = ({ watchlistIds, onWatchlistChange, onCardClick }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/recommendations')
      .then((res) => {
        const movies = res.data.map((item) => ({
          id: item.movieId,
          title: item.title,
          description: item.description,
          genre: item.genre,
          thumbnailUrl: item.thumbnailUrl,
          bannerUrl: item.bannerUrl,
          videoUrl: item.videoUrl,
          rating: item.rating,
          aiReason: item.reason,
          matchScore: item.matchScore,
        }));
        setItems(movies);
      })
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <div className="ai-section-wrap">
      <MovieCarousel
        title={
          <span className="ai-title-inner">
            <Sparkles size={22} color="#e50914" /> AI Picks For You
          </span>
        }
        movies={items}
        watchlistIds={watchlistIds}
        onWatchlistChange={onWatchlistChange}
        onCardClick={onCardClick}
      />
    </div>
  );
};

export default RecommendationsRow;
