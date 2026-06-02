import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Clock3,
  Edit2,
  Heart,
  Mail,
  Play,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';
import { useAuth } from '../context/AuthContext';

const AVATARS = [
  { id: 'blue', color: '#1a73e8', label: 'Film' },
  { id: 'red', color: '#e50914', label: 'Pop' },
  { id: 'green', color: '#2d6a4f', label: 'Stage' },
  { id: 'purple', color: '#7b2cbf', label: 'Rocket' },
  { id: 'yellow', color: '#f9ab00', label: 'Star' },
];

const Profile = () => {
  const { user, profile: viewerProfile, setProfile: setActiveProfile } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, profilesRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/profiles'),
      ]);
      setAccount(userRes.data);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingProfile(p);
    setEditName(p.name);
  };

  const handleUpdate = async (id) => {
    try {
      const response = await api.put(`/profiles/${id}`, {
        ...editingProfile,
        name: editName,
        avatarUrl: editingProfile.avatarUrl,
      });
      setProfiles(profiles.map((p) => (p.id === id ? response.data : p)));
      if (viewerProfile?.id === id) {
        setActiveProfile(response.data);
      }
      setEditingProfile(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    try {
      await api.delete(`/profiles/${id}`);
      setProfiles(profiles.filter((p) => p.id !== id));
      if (viewerProfile?.id === id) {
        setActiveProfile(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const display = account || user;
  const avatar = parseAvatar(viewerProfile?.avatarUrl);
  const history = account?.watchHistory || [];
  const uniqueHistory = useMemo(() => dedupeHistory(history), [history]);
  const totalWatches = history.length;
  const watchlistCount = account?.watchlistCount || 0;

  return (
    <div className="page-home" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={pageStyle}>
        <section style={heroStyle}>
          <div style={identityStyle}>
            <div className="profile-avatar profile-avatar--large" style={{ ...heroAvatarStyle, background: avatar.color }}>
              <span>{initials(viewerProfile?.name || display?.username || 'U')}</span>
            </div>
            <div>
              <p style={eyebrowStyle}>Account</p>
              <h1 style={titleStyle}>{viewerProfile?.name || display?.username || 'Profile'}</h1>
              <p style={subtitleStyle}>Manage profiles, playback activity, and your Netflix clone membership.</p>
            </div>
          </div>
          <Link to="/profiles" className="btn-primary" style={switchButtonStyle}>
            <Users size={18} />
            Switch Profile
          </Link>
        </section>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '56px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <section className="account-stats-grid" style={statsGridStyle}>
              <Stat icon={<Shield size={20} />} label="Account type" value={display?.role || 'USER'} />
              <Stat icon={<Users size={20} />} label="Profiles" value={`${profiles.length}/5`} />
              <Stat icon={<Heart size={20} />} label="Watchlist" value={watchlistCount} />
              <Stat icon={<Clock3 size={20} />} label="Total plays" value={totalWatches} />
            </section>

            <section className="account-top-grid" style={topGridStyle}>
              <div className="glass-panel" style={panelStyle}>
                <SectionHeader title="Your Details" subtitle="Account identity and membership information." />
                <div className="account-details-grid" style={detailsGridStyle}>
                  <Detail icon={<User size={18} />} label="Username" value={display?.username} />
                  <Detail icon={<Mail size={18} />} label="Email" value={display?.email} />
                  <Detail icon={<Shield size={18} />} label="Role" value={display?.role} />
                  <Detail icon={<Heart size={18} />} label="Saved movies" value={`${watchlistCount} movie(s)`} />
                </div>
              </div>

              <div className="glass-panel" style={panelStyle}>
                <SectionHeader title="Profiles" subtitle="Edit names or remove unused profiles." />
                <div className="account-profile-grid" style={profileGridStyle}>
                  {profiles.map((p) => {
                    const pAvatar = parseAvatar(p.avatarUrl);
                    const isEditing = editingProfile?.id === p.id;
                    return (
                      <article key={p.id} style={profileCardStyle}>
                        <div className="profile-avatar" style={{ ...smallAvatarStyle, background: pAvatar.color }}>
                          <span>{initials(p.name)}</span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {isEditing ? (
                            <input
                              type="text"
                              className="form-control"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              style={{ height: 34, fontSize: '0.9rem' }}
                              autoFocus
                            />
                          ) : (
                            <>
                              <h3 style={profileNameStyle}>{p.name}</h3>
                              <p style={profileMetaStyle}>{p.kids ? 'Kids profile' : 'Standard profile'}</p>
                            </>
                          )}
                        </div>
                        <div style={actionGroupStyle}>
                          {isEditing ? (
                            <>
                              <IconButton title="Save" color="#46d369" onClick={() => handleUpdate(p.id)}><Check size={17} /></IconButton>
                              <IconButton title="Cancel" color="#ffc107" onClick={() => setEditingProfile(null)}><X size={17} /></IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton title="Edit" onClick={() => handleEdit(p)}><Edit2 size={17} /></IconButton>
                              <IconButton title="Delete" color="var(--netflix-red)" onClick={() => handleDelete(p.id)}><Trash2 size={17} /></IconButton>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="glass-panel" style={panelStyle}>
              <SectionHeader
                title="Movies You Watched"
                subtitle={uniqueHistory.length ? `${uniqueHistory.length} unique title(s), ${totalWatches} total play event(s).` : 'Your recent playback will appear here.'}
              />
              {!uniqueHistory.length ? (
                <div style={emptyStateStyle}>
                  <Play size={26} />
                  <p style={{ margin: 0 }}>You have not watched any movies yet. Go to Home and press Play.</p>
                </div>
              ) : (
                <div style={historyGridStyle}>
                  {uniqueHistory.map((item) => (
                    <button
                      type="button"
                      key={item.movieId || item.id}
                      onClick={() => navigate(`/watch/${item.movieId}`)}
                      style={historyCardStyle}
                    >
                      <div style={{ ...historyPosterStyle, backgroundImage: `url(${resolveMediaUrl(item.thumbnailUrl)})` }} />
                      <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                        <h3 style={historyTitleStyle}>{item.title}</h3>
                        <p style={historyMetaStyle}>{item.genre || 'Movie'} - Last watched {formatDate(item.watchedAt)}</p>
                        {item.playCount > 1 && <span style={replayPillStyle}>{item.playCount} plays</span>}
                      </div>
                      <span style={playBadgeStyle}><Play size={17} /></span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <style>{`
        @media (max-width: 920px) {
          .account-stats-grid,
          .account-top-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 680px) {
          .account-stats-grid,
          .account-top-grid,
          .account-details-grid,
          .account-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 18 }}>
    <h2 style={sectionTitleStyle}>{title}</h2>
    <p style={sectionSubtitleStyle}>{subtitle}</p>
  </div>
);

const Stat = ({ icon, label, value }) => (
  <div className="glass-panel" style={statCardStyle}>
    <span style={statIconStyle}>{icon}</span>
    <span>
      <span style={statLabelStyle}>{label}</span>
      <span style={statValueStyle}>{value}</span>
    </span>
  </div>
);

const Detail = ({ icon, label, value }) => (
  <div style={detailStyle}>
    <span style={{ color: 'var(--netflix-red)' }}>{icon}</span>
    <span>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value || '-'}</span>
    </span>
  </div>
);

const IconButton = ({ children, color = '#aaa', onClick, title }) => (
  <button type="button" title={title} onClick={onClick} style={{ ...iconButtonStyle, color }}>
    {children}
  </button>
);

const parseAvatar = (value) => {
  if (!value) return AVATARS[0];
  try {
    const parsed = JSON.parse(value);
    return { ...AVATARS[0], ...parsed };
  } catch {
    return AVATARS[0];
  }
};

const dedupeHistory = (items) => {
  const byMovie = new Map();
  items.forEach((item) => {
    const key = item.movieId || item.id;
    const existing = byMovie.get(key);
    if (!existing) {
      byMovie.set(key, { ...item, playCount: 1 });
      return;
    }
    const newer = new Date(item.watchedAt) > new Date(existing.watchedAt) ? item : existing;
    byMovie.set(key, { ...newer, playCount: existing.playCount + 1 });
  });
  return [...byMovie.values()].sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
};

const initials = (name = 'U') => name.trim().slice(0, 2).toUpperCase();
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';

const pageStyle = { padding: '104px 4% 48px', maxWidth: 1180, margin: '0 auto' };
const heroStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 22, flexWrap: 'wrap' };
const identityStyle = { display: 'flex', alignItems: 'center', gap: 18 };
const heroAvatarStyle = { border: '2px solid rgba(255,255,255,0.16)', boxShadow: '0 16px 50px rgba(0,0,0,0.35)' };
const eyebrowStyle = { margin: '0 0 6px', color: 'var(--netflix-red)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.78rem' };
const titleStyle = { margin: 0, fontSize: '2.55rem', lineHeight: 1.04, fontWeight: 900 };
const subtitleStyle = { margin: '8px 0 0', color: '#a0a0a0', lineHeight: 1.45 };
const switchButtonStyle = { display: 'inline-flex', alignItems: 'center', gap: 9, height: 46 };
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 };
const topGridStyle = { display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, marginBottom: 18 };
const panelStyle = { padding: 24, borderRadius: 8, marginBottom: 0 };
const sectionTitleStyle = { margin: 0, fontSize: '1.15rem', fontWeight: 850 };
const sectionSubtitleStyle = { margin: '5px 0 0', color: '#888', fontSize: '0.9rem' };
const statCardStyle = { padding: 16, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' };
const statIconStyle = { color: 'var(--netflix-red)', display: 'flex' };
const statLabelStyle = { display: 'block', color: '#8f8f8f', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 800 };
const statValueStyle = { display: 'block', color: '#fff', fontSize: '1.45rem', fontWeight: 900, marginTop: 2 };
const detailsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 };
const detailStyle = { display: 'flex', alignItems: 'center', gap: 11, background: '#111', border: '1px solid #292929', borderRadius: 8, padding: 13 };
const detailLabelStyle = { display: 'block', color: '#8f8f8f', fontSize: '0.78rem' };
const detailValueStyle = { display: 'block', color: '#fff', fontWeight: 800, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' };
const profileGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 };
const profileCardStyle = { display: 'flex', alignItems: 'center', gap: 12, background: '#111', border: '1px solid #292929', borderRadius: 8, padding: 13 };
const smallAvatarStyle = { width: 44, height: 44, margin: 0, fontSize: '0.92rem', fontWeight: 900 };
const profileNameStyle = { margin: 0, fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const profileMetaStyle = { margin: '3px 0 0', color: '#8a8a8a', fontSize: '0.8rem' };
const actionGroupStyle = { display: 'flex', gap: 6, flexShrink: 0 };
const iconButtonStyle = { width: 32, height: 32, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', display: 'grid', placeItems: 'center', cursor: 'pointer' };
const historyGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 };
const historyCardStyle = { display: 'flex', alignItems: 'center', gap: 14, background: '#111', border: '1px solid #292929', borderRadius: 8, padding: 12, color: '#fff', cursor: 'pointer', minWidth: 0 };
const historyPosterStyle = { width: 116, height: 68, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 5, flexShrink: 0, backgroundColor: '#222' };
const historyTitleStyle = { margin: 0, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const historyMetaStyle = { margin: '5px 0 0', color: '#858585', fontSize: '0.84rem' };
const replayPillStyle = { display: 'inline-block', marginTop: 8, padding: '4px 8px', borderRadius: 999, background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.35)', color: '#fff', fontSize: '0.75rem' };
const playBadgeStyle = { width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--netflix-red)', color: 'var(--netflix-red)', display: 'grid', placeItems: 'center', flexShrink: 0 };
const emptyStateStyle = { minHeight: 120, display: 'grid', placeItems: 'center', gap: 10, color: '#8f8f8f', border: '1px dashed #333', borderRadius: 8 };

export default Profile;
