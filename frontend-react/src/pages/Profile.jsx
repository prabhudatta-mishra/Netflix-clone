import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { resolveMediaUrl } from '../api/media';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Heart, Play, Edit2, Trash2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const AVATARS = [
  { id: 'blue', color: '#1a73e8', emoji: '🎬' },
  { id: 'red', color: '#e50914', emoji: '🍿' },
  { id: 'green', color: '#2d6a4f', emoji: '🎭' },
  { id: 'purple', color: '#7b2cbf', emoji: '🚀' },
  { id: 'yellow', color: '#f9ab00', emoji: '🌟' },
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
        api.get('/profiles')
      ]);
      setAccount(userRes.data);
      setProfiles(profilesRes.data);
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
        avatarUrl: editingProfile.avatarUrl // Keep existing
      });
      setProfiles(profiles.map(p => p.id === id ? response.data : p));
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
      setProfiles(profiles.filter(p => p.id !== id));
      if (viewerProfile?.id === id) {
        setActiveProfile(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const display = account || user;
  const avatar = viewerProfile?.avatarUrl ? JSON.parse(viewerProfile.avatarUrl) : AVATARS[0];

  return (
    <div className="page-home" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="profile-page-inner">
        <div className="profile-header-row">
          {viewerProfile && (
            <div className="profile-avatar profile-avatar--large" style={{ background: avatar.color }}>
              <span>{avatar.emoji}</span>
            </div>
          )}
          <div>
            <h1 className="profile-page-title">Account</h1>
            <p className="profile-subtitle">Membership &amp; playback settings</p>
          </div>
          <Link to="/profiles" className="btn-secondary profile-switch-btn">Switch Profile</Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="glass-panel profile-card-section">
              <h2 style={{ fontSize: '1.1rem', color: '#888', marginBottom: '16px' }}>Profiles</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {profiles.map((p) => {
                  const pAvatar = p.avatarUrl ? JSON.parse(p.avatarUrl) : AVATARS[0];
                  const isEditing = editingProfile?.id === p.id;

                  return (
                    <div key={p.id} className="glass-panel" style={{ padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
                      <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem', margin: 0, background: pAvatar.color }}>
                        <span>{pAvatar.emoji}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ height: '32px', fontSize: '0.9rem' }}
                            autoFocus
                          />
                        ) : (
                          <div style={{ fontWeight: 600 }}>{p.name} {p.kids && <span style={{ color: 'var(--netflix-red)', fontSize: '0.7rem', marginLeft: '4px' }}>KIDS</span>}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleUpdate(p.id)} style={{ background: 'none', border: 'none', color: '#46d369', cursor: 'pointer' }}><Check size={18} /></button>
                            <button onClick={() => setEditingProfile(null)} style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer' }}><X size={18} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer' }}><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel profile-card-section">
              <h2 style={{ fontSize: '1.1rem', color: '#888', marginBottom: '16px' }}>Your details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Row icon={<User size={18} />} label="Username" value={display?.username} />
                <Row icon={<Mail size={18} />} label="Email" value={display?.email} />
                <Row icon={<Shield size={18} />} label="Account type" value={display?.role} />
                {account && (
                  <Row icon={<Heart size={18} />} label="Watchlist" value={`${account.watchlistCount} movie(s) saved`} />
                )}
              </div>
            </div>

            <div className="glass-panel profile-card-section">
              <h2 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Movies you watched</h2>
              {!account?.watchHistory?.length ? (
                <p style={{ color: '#888' }}>You have not watched any movies yet. Go to Home and press Play.</p>
              ) : (
                <div className="history-grid">
                  {account.watchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="history-card"
                      onClick={() => navigate(`/watch/${item.movieId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div
                        className="history-thumb"
                        style={{ backgroundImage: `url(${resolveMediaUrl(item.thumbnailUrl)})` }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px' }}>{item.title}</h4>
                        <span style={{ color: '#888', fontSize: '0.85rem' }}>{item.genre}</span>
                        <small style={{ display: 'block', color: '#666', marginTop: '6px' }}>
                          {new Date(item.watchedAt).toLocaleString()}
                        </small>
                      </div>
                      <Play size={20} color="var(--netflix-red)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Row = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <span style={{ color: '#888' }}>{icon}</span>
    <span style={{ color: '#888', minWidth: '100px' }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

export default Profile;
