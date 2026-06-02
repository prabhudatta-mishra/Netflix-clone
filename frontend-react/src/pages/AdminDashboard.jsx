import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bookmark,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Film,
  Plus,
  Play,
  RefreshCw,
  Save,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';
import { useAuth } from '../context/AuthContext';

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
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState(emptyMovieForm());
  const [thumbnailFile, setThumbnailFile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (users.length === 0) {
      setSelectedUserId(null);
      return;
    }
    if (!selectedUserId || !users.some((u) => userKey(u) === selectedUserId)) {
      setSelectedUserId(userKey(users[0]));
    }
  }, [users, selectedUserId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [moviesRes, statsRes, usersRes, inboxRes] = await Promise.all([
        api.get('/movies'),
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/offline-inbox'),
      ]);
      setMovies(moviesRes.data || []);
      setStats(statsRes.data || {});
      setUsers(usersRes.data || []);
      setOfflineFolder(inboxRes.data?.folder || 'backend/offline-import');
    } catch (err) {
      setError(err.response?.data?.message || 'Start backend on port 8080, then refresh the admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMovies = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    setSyncLog([]);
    try {
      const res = await api.post('/admin/sync-movies');
      setSyncLog(res.data.steps || []);
      setSuccess(`Catalog synced. ${res.data.totalMovies} movies are ready for users.`);
      await fetchDashboardData();
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
      await fetchDashboardData();
    } catch {
      setError('Could not delete movie.');
    }
  };

  const startNewMovie = () => {
    setEditingMovie({ id: null });
    setMovieForm(emptyMovieForm());
    setThumbnailFile(null);
    setError('');
    setSuccess('');
  };

  const startEditMovie = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title || '',
      description: movie.description || '',
      genre: movie.genre || '',
      releaseYear: movie.releaseYear || '',
      thumbnailUrl: movie.thumbnailUrl || '',
      bannerUrl: movie.bannerUrl || '',
      videoUrl: movie.videoUrl || '',
      fallbackVideoUrls: movie.fallbackVideoUrls || '',
      rating: movie.rating || '',
    });
    setThumbnailFile(null);
    setError('');
    setSuccess('');
  };

  const cancelMovieEdit = () => {
    setEditingMovie(null);
    setMovieForm(emptyMovieForm());
    setThumbnailFile(null);
  };

  const handleMovieFormChange = (field, value) => {
    setMovieForm((current) => ({ ...current, [field]: value }));
  };

  const saveMovie = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingMovie?.id) {
        const payload = {
          ...movieForm,
          releaseYear: movieForm.releaseYear ? Number(movieForm.releaseYear) : null,
          rating: movieForm.rating ? Number(movieForm.rating) : null,
        };
        await api.put(`/movies/${editingMovie.id}`, payload);
        setSuccess(`Updated "${payload.title}".`);
      } else {
        if (!thumbnailFile) {
          setError('Please choose a thumbnail image.');
          return;
        }
        const formData = new FormData();
        formData.append('title', movieForm.title);
        formData.append('description', movieForm.description || '');
        formData.append('genre', movieForm.genre || 'General');
        if (movieForm.releaseYear) formData.append('releaseYear', movieForm.releaseYear);
        if (movieForm.rating) formData.append('rating', movieForm.rating);
        formData.append('thumbnail', thumbnailFile);
        await api.post('/movies/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess(`Added "${movieForm.title}". Add the MP4 later through offline-import and Sync Movies.`);
      }
      cancelMovieEdit();
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save movie. Check required title and video URL.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!targetUser?.id && !targetUser?.username) {
      setError('Cannot delete this user because the backend did not send an id or username.');
      return;
    }
    if (targetUser.username === loggedInAdmin?.username) {
      setError('You cannot delete the admin account you are currently using.');
      return;
    }
    if (!window.confirm(`Delete user "${targetUser.username}" and all watch activity?`)) return;
    try {
      await deleteUserRequest(targetUser);
      setSuccess(`Deleted user "${targetUser.username}".`);
      setSelectedUserId(null);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not delete user.');
    }
  };

  const deleteUserRequest = async (targetUser) => {
    const actionPath = `/admin/delete-user?username=${encodeURIComponent(targetUser.username)}`;
    const usernamePath = `/admin/users?username=${encodeURIComponent(targetUser.username)}`;
    const usernamePostPath = `/admin/users/delete?username=${encodeURIComponent(targetUser.username)}`;
    try {
      return await api.post(actionPath);
    } catch (actionErr) {
      if (actionErr.response?.status && actionErr.response.status !== 404 && actionErr.response.status !== 405) {
        throw actionErr;
      }
    }

    if (!targetUser.id) {
      try {
        return await api.delete(usernamePath);
      } catch (err) {
        if (err.response?.status === 405) {
          return api.post(usernamePostPath);
        }
        throw err;
      }
    }

    try {
      return await api.delete(`/admin/users/${targetUser.id}`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || status === 400 || status === 405) {
        try {
          return await api.delete(usernamePath);
        } catch (fallbackErr) {
          if (fallbackErr.response?.status === 405) {
            return api.post(targetUser.id ? `/admin/users/${targetUser.id}/delete` : usernamePostPath);
          }
          throw fallbackErr;
        }
      }
      throw err;
    }
  };

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.username, u.email, u.role, ...(u.watchedMovies || []), ...(u.watchlistMovies || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [query, users]);

  const dashboardStats = useMemo(() => {
    const watchedCount = users.reduce((sum, u) => sum + (u.totalWatchEvents ?? unique(u.watchedMovies).length), 0);
    const activeUsers = users.filter((u) => (u.totalWatchEvents || 0) > 0 || (u.watchlistMovieCount || unique(u.watchlistMovies).length) > 0).length;
    const playableMovies = movies.filter((m) => Boolean(m.videoUrl)).length;
    return { watchedCount, activeUsers, playableMovies };
  }, [movies, users]);

  const currentUser = users.find((u) => userKey(u) === selectedUserId) || filteredUsers[0] || null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-black)', paddingBottom: '4rem' }}>
      <Navbar />

      <main style={{ padding: '104px 4% 0', maxWidth: 1280, margin: '0 auto' }}>
        <section style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Admin control center</p>
            <h1 style={titleStyle}>User Activity Dashboard</h1>
            <p style={subtitleStyle}>
              Signed in as <strong style={{ color: '#fff' }}>{loggedInAdmin?.username || 'admin'}</strong>.
              Track users, playable movies, watch history, and watchlists from one screen.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleSyncMovies} disabled={syncing} style={syncButtonStyle}>
            <RefreshCw size={20} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing' : 'Sync Movies'}
          </button>
        </section>

        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <section className="admin-stats-grid" style={statsGridStyle}>
          <StatCard icon={<Film size={22} />} label="Catalog movies" value={stats.totalMovies || movies.length} note={`${dashboardStats.playableMovies} with video`} />
          <StatCard icon={<Users size={22} />} label="Users" value={stats.totalUsers || users.length} note={`${dashboardStats.activeUsers} active`} />
          <StatCard icon={<Eye size={22} />} label="Watched titles" value={dashboardStats.watchedCount} note="Unique per user" />
          <StatCard icon={<Bookmark size={22} />} label="Watchlist saves" value={stats.totalWatchlists || 0} note="Across all users" />
        </section>

        <section className="admin-main-grid" style={mainGridStyle}>
          <div className="glass-panel" style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Users</h2>
                <p style={mutedTextStyle}>Click a user to inspect what they can watch, watched, and saved.</p>
              </div>
            </div>

            <div style={searchBoxStyle}>
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users or movie activity"
                style={searchInputStyle}
              />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {loading && <p style={mutedTextStyle}>Loading users...</p>}
              {!loading && filteredUsers.length === 0 && <p style={mutedTextStyle}>No users match this search.</p>}
              {filteredUsers.map((user) => (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => setSelectedUserId(userKey(user))}
                  style={{
                    ...userRowStyle,
                    borderColor: userKey(currentUser) === userKey(user) ? 'var(--netflix-red)' : '#2a2a2a',
                    background: userKey(currentUser) === userKey(user) ? 'rgba(229,9,20,0.18)' : '#121212',
                  }}
                >
                  <span style={avatarStyle}>{initials(user.username)}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={userNameStyle}>{user.username}</span>
                    <span style={userMetaStyle}>{user.email || 'No email'} - {user.role}</span>
                  </span>
                  <span style={activityBadgeStyle}>{user.totalWatchEvents ?? unique(user.watchedMovies).length} plays</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>{currentUser ? `${currentUser.username} details` : 'User details'}</h2>
                <p style={mutedTextStyle}>Per-user catalog access and activity.</p>
              </div>
              {currentUser && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={rolePillStyle}>{currentUser.role}</span>
                  <button
                    type="button"
                    title="Delete user"
                    onClick={() => handleDeleteUser(currentUser)}
                    disabled={currentUser.username === loggedInAdmin?.username}
                    style={{
                      ...dangerUserButtonStyle,
                      opacity: currentUser.username === loggedInAdmin?.username ? 0.45 : 1,
                      cursor: currentUser.username === loggedInAdmin?.username ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                    Delete User
                  </button>
                </div>
              )}
            </div>

            {currentUser ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={miniStatsStyle}>
                  <MiniStat icon={<CheckCircle2 size={18} />} label="Can play" value={currentUser.playableMovieCount ?? unique(currentUser.moviesCanWatch).length} />
                  <MiniStat icon={<Clock3 size={18} />} label="Play events" value={currentUser.totalWatchEvents ?? unique(currentUser.watchedMovies).length} />
                  <MiniStat icon={<Bookmark size={18} />} label="Watchlist" value={currentUser.watchlistMovieCount ?? unique(currentUser.watchlistMovies).length} />
                </div>

                <ActivityList
                  title="Movies this user can play"
                  items={unique(currentUser.moviesCanWatch)}
                  empty="No playable movies found."
                  max={8}
                />
                <ActivityList
                  title="Watched movies"
                  items={unique(currentUser.watchedMovies)}
                  empty="This user has not watched anything yet."
                />
                <ActivityList
                  title="Saved in watchlist"
                  items={unique(currentUser.watchlistMovies)}
                  empty="No watchlist movies yet."
                />
              </div>
            ) : (
              <p style={mutedTextStyle}>Select a user to view details.</p>
            )}
          </div>
        </section>

        <section className="admin-secondary-grid" style={secondaryGridStyle}>
          <div className="glass-panel" style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Movie Library</h2>
                <p style={mutedTextStyle}>Add, edit, test playback, or remove catalog items.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={startNewMovie} style={smallActionButtonStyle}>
                <Plus size={17} />
                Add Movie
              </button>
            </div>

            {editingMovie && (
              <form onSubmit={saveMovie} style={movieFormStyle}>
                <div style={formGridStyle}>
                  <FormField label="Title" value={movieForm.title} onChange={(value) => handleMovieFormChange('title', value)} required />
                  <FormField label="Genre" value={movieForm.genre} onChange={(value) => handleMovieFormChange('genre', value)} />
                  <FormField label="Year" type="number" value={movieForm.releaseYear} onChange={(value) => handleMovieFormChange('releaseYear', value)} />
                  <FormField label="Rating" type="number" step="0.1" value={movieForm.rating} onChange={(value) => handleMovieFormChange('rating', value)} />
                </div>
                <FormField label="Description" value={movieForm.description} onChange={(value) => handleMovieFormChange('description', value)} />
                {editingMovie.id ? (
                  <FormField label="Thumbnail URL" value={movieForm.thumbnailUrl} onChange={(value) => handleMovieFormChange('thumbnailUrl', value)} />
                ) : (
                  <label style={fieldLabelStyle}>
                    Thumbnail image
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
                      style={fieldInputStyle}
                    />
                  </label>
                )}
                <p style={formHintStyle}>
                  Movie file is added separately: copy a matching MP4 into offline-import, then click Sync Movies.
                </p>
                <div style={formActionsStyle}>
                  <button type="submit" className="btn-primary" style={smallActionButtonStyle}><Save size={17} /> Save Movie</button>
                  <button type="button" className="btn-secondary" onClick={cancelMovieEdit} style={smallActionButtonStyle}><X size={17} /> Cancel</button>
                </div>
              </form>
            )}

            <div style={movieGridStyle}>
              {movies.map((movie) => (
                <article key={movie.id} style={movieCardStyle}>
                  <img src={resolveMediaUrl(movie.thumbnailUrl)} alt="" style={posterStyle} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={movieTitleStyle}>{movie.title}</h3>
                    <p style={movieMetaStyle}>{movie.genre || 'General'} - Rating {formatRating(movie.rating)}</p>
                    <span style={movieStatusStyle}>{movie.videoUrl ? 'Ready to test' : 'No video linked'}</span>
                  </div>
                  <button type="button" title="Play" style={iconButtonStyle} onClick={() => navigate(`/watch/${movie.id}`)}>
                    <Play size={17} />
                  </button>
                  <button type="button" title="Edit" style={iconButtonStyle} onClick={() => startEditMovie(movie)}>
                    <Edit3 size={17} />
                  </button>
                  <button type="button" title="Delete" style={dangerIconButtonStyle} onClick={() => handleDelete(movie.id, movie.title)}>
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Import Folder</h2>
                <p style={mutedTextStyle}>For offline movie files. Keep this secondary to user monitoring.</p>
              </div>
            </div>
            <div style={folderBoxStyle}>{offlineFolder || 'backend\\offline-import'}</div>
            <div style={compactStepsStyle}>
              <Step n={1} text="Copy a browser-friendly MP4 into the folder." />
              <Step n={2} text="Click Sync Movies." />
              <Step n={3} text="Open Movie Library and test Play." />
            </div>
            {syncLog.length > 0 && (
              <div style={logBoxStyle}>
                {syncLog.map((line, index) => (
                  <p key={index} style={{ margin: 0 }}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .admin-main-grid, .admin-secondary-grid { grid-template-columns: 1fr !important; }
          .admin-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 560px) {
          .admin-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const ActivityList = ({ title, items, empty, max }) => {
  const visible = max ? items.slice(0, max) : items;
  const remaining = max && items.length > max ? items.length - max : 0;
  return (
    <div>
      <h3 style={listTitleStyle}>{title}</h3>
      {items.length === 0 ? (
        <p style={emptyTextStyle}>{empty}</p>
      ) : (
        <div style={chipWrapStyle}>
          {visible.map((item) => <span key={item} style={chipStyle}>{item}</span>)}
          {remaining > 0 && <span style={chipMutedStyle}>+{remaining} more</span>}
        </div>
      )}
    </div>
  );
};

const Step = ({ n, text }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
    <span style={stepDotStyle}>{n}</span>
    <span style={{ color: '#c7c7c7' }}>{text}</span>
  </div>
);

const StatCard = ({ icon, label, value, note }) => (
  <div className="glass-panel" style={statCardStyle}>
    <span style={statIconStyle}>{icon}</span>
    <div>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      <div style={statNoteStyle}>{note}</div>
    </div>
  </div>
);

const MiniStat = ({ icon, label, value }) => (
  <div style={miniStatStyle}>
    <span style={{ color: 'var(--netflix-red)' }}>{icon}</span>
    <span>
      <span style={miniValueStyle}>{value}</span>
      <span style={miniLabelStyle}>{label}</span>
    </span>
  </div>
);

const Alert = ({ type, children }) => (
  <div style={{
    background: type === 'success' ? '#2f9e44' : 'var(--netflix-red)',
    color: '#fff',
    padding: '13px 16px',
    borderRadius: 6,
    marginBottom: 18,
  }}>{children}</div>
);

const FormField = ({ label, value, onChange, type = 'text', required = false, step }) => (
  <label style={fieldLabelStyle}>
    {label}
    <input
      type={type}
      step={step}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={fieldInputStyle}
    />
  </label>
);

const emptyMovieForm = () => ({
  title: '',
  description: '',
  genre: '',
  releaseYear: '',
  thumbnailUrl: '',
  bannerUrl: '',
  videoUrl: '',
  fallbackVideoUrls: '',
  rating: '',
});

const unique = (items = []) => [...new Set((items || []).filter(Boolean))];
const userKey = (user) => user?.id ? String(user.id) : user?.username || '';
const initials = (name = 'U') => name.slice(0, 2).toUpperCase();
const formatRating = (rating) => Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : 'N/A';

const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', marginBottom: 22 };
const eyebrowStyle = { color: 'var(--netflix-red)', textTransform: 'uppercase', fontSize: '0.74rem', fontWeight: 800, letterSpacing: 0, margin: '0 0 8px' };
const titleStyle = { fontSize: '2.35rem', lineHeight: 1.05, margin: 0, fontWeight: 900 };
const subtitleStyle = { color: '#9a9a9a', margin: '10px 0 0', maxWidth: 720, lineHeight: 1.5 };
const syncButtonStyle = { height: 46, minWidth: 150, justifyContent: 'center', gap: 9 };
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 };
const mainGridStyle = { display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, marginBottom: 18 };
const secondaryGridStyle = { display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 18 };
const panelStyle = { padding: 22, borderRadius: 8 };
const sectionHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16 };
const sectionTitleStyle = { fontSize: '1.15rem', margin: 0, fontWeight: 800 };
const mutedTextStyle = { color: '#8f8f8f', margin: '5px 0 0', fontSize: '0.9rem', lineHeight: 1.45 };
const statCardStyle = { padding: 16, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' };
const statIconStyle = { color: 'var(--netflix-red)', display: 'flex' };
const statLabelStyle = { color: '#8d8d8d', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 700 };
const statValueStyle = { fontSize: '1.65rem', fontWeight: 900, lineHeight: 1.05 };
const statNoteStyle = { color: '#777', fontSize: '0.8rem', marginTop: 3 };
const searchBoxStyle = { display: 'flex', alignItems: 'center', gap: 10, background: '#0d0d0d', border: '1px solid #2b2b2b', borderRadius: 6, padding: '10px 12px', marginBottom: 14, color: '#aaa' };
const searchInputStyle = { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: '#fff', fontSize: '0.94rem' };
const userRowStyle = { width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', border: '1px solid #2a2a2a', borderRadius: 8, padding: 12, color: '#fff', cursor: 'pointer' };
const avatarStyle = { width: 38, height: 38, borderRadius: '50%', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 };
const userNameStyle = { display: 'block', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const userMetaStyle = { display: 'block', color: '#8e8e8e', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 };
const activityBadgeStyle = { color: '#fff', background: '#242424', border: '1px solid #333', borderRadius: 999, padding: '5px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' };
const rolePillStyle = { border: '1px solid rgba(229,9,20,0.55)', color: '#fff', borderRadius: 999, padding: '5px 10px', fontSize: '0.76rem', fontWeight: 800 };
const dangerUserButtonStyle = { height: 32, borderRadius: 6, border: '1px solid rgba(229,9,20,0.5)', background: 'rgba(229,9,20,0.12)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 10px', fontWeight: 800, fontSize: '0.78rem' };
const miniStatsStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 };
const miniStatStyle = { display: 'flex', gap: 9, alignItems: 'center', background: '#111', border: '1px solid #282828', borderRadius: 8, padding: 12 };
const miniValueStyle = { display: 'block', fontWeight: 900, color: '#fff', lineHeight: 1 };
const miniLabelStyle = { display: 'block', color: '#858585', fontSize: '0.75rem', marginTop: 3 };
const listTitleStyle = { fontSize: '0.92rem', margin: '0 0 9px', color: '#f2f2f2' };
const emptyTextStyle = { color: '#777', margin: 0, fontSize: '0.88rem' };
const chipWrapStyle = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chipStyle = { background: '#191919', border: '1px solid #303030', borderRadius: 999, padding: '7px 10px', color: '#ddd', fontSize: '0.82rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const chipMutedStyle = { ...chipStyle, color: '#999', borderStyle: 'dashed' };
const movieGridStyle = { display: 'grid', gap: 10, maxHeight: 520, overflow: 'auto', paddingRight: 4 };
const movieCardStyle = { display: 'flex', alignItems: 'center', gap: 12, background: '#111', border: '1px solid #272727', borderRadius: 8, padding: 10 };
const posterStyle = { width: 42, height: 58, borderRadius: 4, objectFit: 'cover', flexShrink: 0, background: '#222' };
const movieTitleStyle = { margin: 0, fontSize: '0.94rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const movieMetaStyle = { margin: '4px 0', color: '#858585', fontSize: '0.8rem' };
const movieStatusStyle = { color: '#46d369', fontSize: '0.76rem' };
const iconButtonStyle = { width: 34, height: 34, borderRadius: 6, border: '1px solid #333', background: '#1c1c1c', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 };
const dangerIconButtonStyle = { ...iconButtonStyle, color: 'var(--netflix-red)' };
const folderBoxStyle = { background: '#0d0d0d', color: '#7fdbff', border: '1px solid #252525', borderRadius: 6, padding: 12, fontFamily: 'monospace', fontSize: '0.83rem', wordBreak: 'break-all', marginBottom: 14 };
const compactStepsStyle = { display: 'grid', gap: 11, marginBottom: 14 };
const stepDotStyle = { width: 24, height: 24, borderRadius: '50%', background: 'var(--netflix-red)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.76rem', fontWeight: 900, flexShrink: 0 };
const logBoxStyle = { display: 'grid', gap: 7, background: '#0f0f0f', border: '1px solid #292929', borderRadius: 6, padding: 12, color: '#aaa', fontSize: '0.84rem', lineHeight: 1.4 };
const smallActionButtonStyle = { minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 12px', whiteSpace: 'nowrap' };
const movieFormStyle = { display: 'grid', gap: 10, background: '#0e0e0e', border: '1px solid #292929', borderRadius: 8, padding: 14, marginBottom: 14 };
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 };
const fieldLabelStyle = { display: 'grid', gap: 6, color: '#9b9b9b', fontSize: '0.78rem', fontWeight: 800 };
const fieldInputStyle = { width: '100%', minHeight: 38, borderRadius: 5, border: '1px solid #303030', background: '#111', color: '#fff', padding: '8px 10px', outline: 0, fontSize: '0.9rem' };
const formHintStyle = { margin: '2px 0 0', color: '#8f8f8f', fontSize: '0.84rem', lineHeight: 1.4 };
const formActionsStyle = { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' };

export default AdminDashboard;
