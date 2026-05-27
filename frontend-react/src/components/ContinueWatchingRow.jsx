import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';

const ContinueWatchingRow = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/continue').then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section className="carousel-section continue-section">
      <h2 className="carousel-title">Continue Watching</h2>
      <div className="continue-row">
        {items.map((item) => (
          <div
            key={item.movieId}
            className="continue-card"
            onClick={() => navigate(`/watch/${item.movieId}`)}
          >
            <div
              className="continue-thumb"
              style={{ backgroundImage: `url(${resolveMediaUrl(item.thumbnailUrl)})` }}
            >
              <div className="continue-play"><Play size={28} fill="#fff" /></div>
              <div className="continue-progress">
                <div className="continue-progress-bar" style={{ width: `${item.progressPercent}%` }} />
              </div>
            </div>
            <p className="continue-title">{item.title}</p>
            <span className="continue-meta">{item.progressPercent}% watched</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContinueWatchingRow;
