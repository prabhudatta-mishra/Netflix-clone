import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Play, RotateCcw, Search, Trash2, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [continueMap, setContinueMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const [historyRes, continueRes] = await Promise.all([
        api.get('/history'),
        api.get('/continue'),
      ]);
      setHistory(resUniqueHistory(historyRes.data || []));
      setContinueMap(new Map((continueRes.data || []).map((item) => [item.movieId, item])));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load watch history.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return history;
    return history.filter((item) =>
      [item.title, item.genre].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    );
  }, [history, query]);

  const deleteItem = async (historyId) => {
    try {
      await api.post(`/history/delete/${historyId}`);
      setHistory((prev) => prev.filter((item) => item.id !== historyId));
    } catch (err) {
      try {
        await api.delete(`/history/${historyId}`);
        setHistory((prev) => prev.filter((item) => item.id !== historyId));
      } catch (fallbackErr) {
        setError(fallbackErr.response?.data?.message || fallbackErr.message || 'Could not delete history item.');
      }
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all watch history?')) return;
    try {
      await api.post('/history/clear');
      setHistory([]);
    } catch (err) {
      try {
        await api.delete('/history');
        setHistory([]);
      } catch (fallbackErr) {
        setError(fallbackErr.response?.data?.message || fallbackErr.message || 'Could not clear history.');
      }
    }
  };

  return (
    <div className="page-home" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Playback activity</p>
            <h1 style={titleStyle}>Watch History</h1>
            <p style={subtitleStyle}>{history.length} play event(s) saved on this account.</p>
          </div>
          <div style={toolbarStyle}>
            <div style={searchBoxStyle}>
              <Search size={18} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search history" style={searchInputStyle} />
            </div>
            {history.length > 0 && (
              <button type="button" style={clearButtonStyle} onClick={clearAll}>
                <XCircle size={17} />
                Clear All
              </button>
            )}
          </div>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <div style={loadingStyle}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={emptyStyle}>
            <Clock size={48} />
            <h2 style={{ margin: 0 }}>No watch history yet</h2>
            <p style={{ color: '#8f8f8f', margin: 0 }}>Start streaming and your playback activity will appear here.</p>
          </div>
        ) : (
          <section style={listStyle}>
            {filtered.map((item) => {
              const progress = continueMap.get(item.movieId);
              const percent = Math.min(100, Math.max(0, progress?.progressPercent || 0));
              const completed = percent >= 90;
              return (
              <article key={item.id} style={rowStyle}>
                <button type="button" onClick={() => navigate(`/watch/${item.movieId}`)} style={thumbButtonStyle}>
                  <img src={resolveMediaUrl(item.thumbnailUrl)} alt="" style={thumbStyle} />
                  <span style={thumbOverlayStyle}><Play size={22} fill="#fff" /></span>
                  {progress && (
                    <span style={progressTrackStyle}>
                      <span style={{ ...progressBarStyle, width: `${percent}%` }} />
                    </span>
                  )}
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 style={movieTitleStyle}>{item.title}</h2>
                  <p style={movieMetaStyle}>{item.genre || 'Movie'} - Watched {formatDate(item.watchedAt)}</p>
                  <div style={resumeMetaStyle}>
                    {completed ? <CheckCircle2 size={15} /> : <RotateCcw size={15} />}
                    <span>{progress ? progressLabel(progress, completed) : 'Watched recently'}</span>
                  </div>
                </div>
                <button type="button" className="btn-primary" style={playButtonStyle} onClick={() => navigate(`/watch/${item.movieId}`)}>
                  <Play size={16} />
                  {progress && !completed ? 'Resume' : 'Play'}
                </button>
                <button type="button" title="Delete history item" style={deleteButtonStyle} onClick={() => deleteItem(item.id)}>
                  <Trash2 size={17} />
                </button>
              </article>
            );})}
          </section>
        )}
      </main>
    </div>
  );
};

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'recently';
const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};
const progressLabel = (progress, completed) => {
  if (completed) return 'Completed';
  return `Resume from ${formatTime(progress.progressSeconds)} - ${progress.progressPercent || 0}% watched`;
};
const resUniqueHistory = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.movieId)) return false;
    seen.add(item.movieId);
    return true;
  });
};

const pageStyle = { padding: '104px 4% 48px', maxWidth: 1120, margin: '0 auto' };
const heroStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap' };
const eyebrowStyle = { color: 'var(--netflix-red)', textTransform: 'uppercase', fontSize: '0.76rem', fontWeight: 900, margin: '0 0 8px' };
const titleStyle = { fontSize: '2.55rem', lineHeight: 1, margin: 0, fontWeight: 900 };
const subtitleStyle = { color: '#999', margin: '10px 0 0' };
const toolbarStyle = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' };
const searchBoxStyle = { display: 'flex', alignItems: 'center', gap: 10, background: '#111', border: '1px solid #2b2b2b', borderRadius: 6, padding: '11px 13px', minWidth: 260, color: '#aaa' };
const searchInputStyle = { background: 'transparent', border: 0, outline: 0, color: '#fff', fontSize: '0.95rem', width: '100%' };
const clearButtonStyle = { height: 42, borderRadius: 6, border: '1px solid rgba(229,9,20,0.5)', background: 'rgba(229,9,20,0.12)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 13px', cursor: 'pointer', fontWeight: 800 };
const listStyle = { display: 'grid', gap: 12 };
const rowStyle = { display: 'flex', alignItems: 'center', gap: 14, background: '#111', border: '1px solid #292929', borderRadius: 8, padding: 12 };
const thumbButtonStyle = { position: 'relative', width: 150, aspectRatio: '16 / 9', padding: 0, border: 0, borderRadius: 6, overflow: 'hidden', background: '#222', cursor: 'pointer', flexShrink: 0 };
const thumbStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const thumbOverlayStyle = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', background: 'rgba(0,0,0,0.16)' };
const movieTitleStyle = { margin: 0, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const movieMetaStyle = { margin: '6px 0 0', color: '#888', fontSize: '0.88rem' };
const resumeMetaStyle = { display: 'inline-flex', alignItems: 'center', gap: 7, color: '#cfcfcf', fontSize: '0.83rem', marginTop: 8 };
const progressTrackStyle = { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,0.18)' };
const progressBarStyle = { display: 'block', height: '100%', background: 'var(--netflix-red)' };
const playButtonStyle = { height: 36, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0 };
const deleteButtonStyle = { width: 36, height: 36, borderRadius: 6, border: '1px solid #333', background: '#191919', color: 'var(--netflix-red)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 };
const loadingStyle = { minHeight: 360, display: 'grid', placeItems: 'center', color: '#999' };
const emptyStyle = { minHeight: 400, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 12, textAlign: 'center', color: '#777', border: '1px dashed #333', borderRadius: 8 };
const errorStyle = { background: 'rgba(229,9,20,0.14)', border: '1px solid rgba(229,9,20,0.45)', color: '#fff', borderRadius: 6, padding: 13, marginBottom: 18 };

export default History;
