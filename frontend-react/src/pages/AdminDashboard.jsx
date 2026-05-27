import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';
import { useAuth } from '../context/AuthContext';
import { Film, User, Heart, Trash2, Activity, RefreshCw, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user: loggedInAdmin } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalMovies: 0, totalUsers: 0, totalWatchlists: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [offlineFolder, setOfflineFolder] = useState('');
  const [syncLog, setSyncLog] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const moviesRes = await api.get('/movies');
      setMovies(moviesRes.data);
    } catch {
      setError('Start backend (port 8080) and npm run dev, then open http://localhost:3000');
    }
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch { /* admin only */ }
    try {
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data);
    } catch { /* admin only */ }
    try {
      const inboxRes = await api.get('/admin/offline-inbox');
      setOfflineFolder(inboxRes.data.folder || '');
    } catch {
      setOfflineFolder('backend/offline-import');
    }
    setLoading(false);
  };

  const handleSyncMovies = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    setSyncLog([]);
    try {
      const res = await api.post('/admin/sync-movies');
      setSyncLog(res.data.steps || []);
      setSuccess(`Done! ${res.data.totalMovies} movies ready — users can press Play on Home.`);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Sync failed. Is backend running?');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id, movieTitle) => {
    if (!window.confirm(`Delete "${movieTitle}"?`)) return;
    try {
      await api.delete(`/movies/${id}`);
      setSuccess(`Deleted "${movieTitle}".`);
      fetchDashboardData();
    } catch {
      setError('Could not delete movie.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-black)', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ padding: '120px 4% 0 4%', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity color="var(--netflix-red)" /> Admin — Add Movies
        </h1>
        {loggedInAdmin && (
          <p style={{ color: '#888', marginBottom: '24px' }}>
            Hello <strong style={{ color: '#fff' }}>{loggedInAdmin.username}</strong>
          </p>
        )}

        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <StatCard icon={<Film size={22} />} label="Movies" value={stats.totalMovies} />
          <StatCard icon={<User size={22} />} label="Users" value={stats.totalUsers} />
          <StatCard icon={<Heart size={22} />} label="Watchlist" value={stats.totalWatchlists} />
        </div>

        {/* Netflix-style: ONE simple workflow */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '8px', marginBottom: '32px', border: '2px solid var(--netflix-red)' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#fff' }}>
            How to add movies (like Netflix — 2 steps)
          </h2>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
            <Step n={1} title="Copy video file to folder">
              Put your downloaded movie here (any video format):
              <code style={codeStyle}>{offlineFolder || 'backend\\offline-import'}</code>
              Example: <code style={codeStyle}>Interstellar.mp4</code>
              Optional poster: <code style={codeStyle}>Interstellar.jpg</code>
            </Step>
            <Step n={2} title="Click Sync Movies">
              Software will import, link, and prepare play — same as Netflix catalog update.
              No browser upload. No extra buttons.
            </Step>
            <Step n={3} title="Users press Play on Home">
              Movie appears for all users automatically.
            </Step>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSyncMovies}
            disabled={syncing}
            style={{ width: '100%', height: '52px', fontSize: '1.1rem', justifyContent: 'center', gap: '10px' }}
          >
            <RefreshCw size={22} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing movies...' : 'Sync Movies'}
          </button>

          {syncLog.length > 0 && (
            <ul style={{ marginTop: '20px', color: '#aaa', fontSize: '0.9rem', lineHeight: 1.8 }}>
              {syncLog.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}

          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '16px' }}>
            Tip: Browser plays H.264 MP4 best. HEVC/x265 files may need conversion (HandBrake → H.264).
            Backend also auto-syncs this folder when it starts.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Your movies</h2>
          {loading ? (
            <p style={{ color: '#888' }}>Loading...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '0.85rem' }}>
                  <th style={th}>Cover</th>
                  <th style={th}>Title</th>
                  <th style={th}>Genre</th>
                  <th style={th}>Rating</th>
                  <th style={th}>Test</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={td}>
                      <img src={resolveMediaUrl(m.thumbnailUrl)} alt="" style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                    </td>
                    <td style={{ ...td, fontWeight: 600 }}>{m.title}</td>
                    <td style={{ ...td, color: '#999' }}>{m.genre}</td>
                    <td style={{ ...td, color: '#ffc107' }}>★ {m.rating?.toFixed(1)}</td>
                    <td style={td}>
                      <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/watch/${m.id}`)}>
                        <Play size={14} /> Play
                      </button>
                    </td>
                    <td style={td}>
                      <button type="button" onClick={() => handleDelete(m.id, m.title)} style={{ background: 'none', border: 'none', color: 'var(--netflix-red)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Users & what they watch</h2>
          {users.map((u) => (
            <div key={u.username} style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>
              <strong>{u.username}</strong>
              <span style={{ color: '#666', marginLeft: '8px' }}>{u.role}</span>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '6px 0 0' }}>
                Watched: {u.watchedMovies?.length ? u.watchedMovies.join(', ') : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const Step = ({ n, title, children }) => (
  <div style={{ display: 'flex', gap: '16px' }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: 'var(--netflix-red)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0,
    }}>{n}</div>
    <div>
      <div style={{ fontWeight: 600, marginBottom: '6px' }}>{title}</div>
      <div style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: 1.6 }}>{children}</div>
    </div>
  </div>
);

const codeStyle = { display: 'block', background: '#111', padding: '8px', borderRadius: '4px', marginTop: '8px', color: '#7fdbff', fontSize: '0.85rem', wordBreak: 'break-all' };
const th = { padding: '10px 8px', textAlign: 'left' };
const td = { padding: '10px 8px' };

const Alert = ({ type, children }) => (
  <div style={{
    background: type === 'success' ? '#46d369' : 'var(--netflix-red)',
    color: type === 'success' ? '#000' : '#fff',
    padding: '14px 20px', borderRadius: '4px', marginBottom: '20px',
  }}>{children}</div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
    <span style={{ color: 'var(--netflix-red)' }}>{icon}</span>
    <div>
      <div style={{ color: '#888', fontSize: '0.75rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
    </div>
  </div>
);

export default AdminDashboard;
