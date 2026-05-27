import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history')
      .then((res) => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-home">
      <Navbar />
      <div style={{ padding: '100px 4% 40px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={28} /> Watch History
        </h1>
        {loading ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p className="empty-text">No watch history yet. Start streaming!</p>
        ) : (
          <div className="history-grid">
            {history.map((item) => (
              <div key={item.id} className="history-card" onClick={() => navigate(`/movie/${item.movieId}`)}>
                <div className="history-thumb" style={{ backgroundImage: `url(${resolveMediaUrl(item.thumbnailUrl)})` }} />
                <div>
                  <h4>{item.title}</h4>
                  <span>{item.genre}</span>
                  <small>{new Date(item.watchedAt).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
