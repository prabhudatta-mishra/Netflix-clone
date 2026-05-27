import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Settings } from 'lucide-react';
import api from '../api/axios';

const AVATARS = [
  { id: 'blue', color: '#1a73e8', emoji: '🎬' },
  { id: 'red', color: '#e50914', emoji: '🍿' },
  { id: 'green', color: '#2d6a4f', emoji: '🎭' },
  { id: 'purple', color: '#7b2cbf', emoji: '🚀' },
  { id: 'yellow', color: '#f9ab00', emoji: '🌟' },
];

const WhoIsWatching = () => {
  const navigate = useNavigate();
  const { setProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isKids, setIsKids] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/profiles');
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (p) => {
    setProfile(p);
    navigate('/browse');
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const response = await api.post('/profiles', {
        name: newProfileName,
        avatarUrl: JSON.stringify(randomAvatar),
        isKids
      });
      setProfiles([...profiles, response.data]);
      setShowAddModal(false);
      setNewProfileName('');
      setIsKids(false);
    } catch (error) {
      console.error('Error adding profile:', error);
      alert(error.response?.data || 'Failed to add profile');
    }
  };

  if (loading) {
    return (
      <div className="profiles-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profiles-page animate-fade-in">
      <h1 className="profiles-title">Who&apos;s watching?</h1>
      <div className="profiles-grid">
        {profiles.map((p) => {
          const avatar = p.avatarUrl ? JSON.parse(p.avatarUrl) : AVATARS[0];
          return (
            <button
              key={p.id}
              type="button"
              className="profile-card"
              onClick={() => selectProfile(p)}
            >
              <div className="profile-avatar" style={{ background: avatar.color }}>
                <span>{avatar.emoji}</span>
              </div>
              <span className="profile-name">{p.name}</span>
            </button>
          );
        })}
        
        {profiles.length < 5 && (
          <button type="button" className="profile-card profile-card--add" onClick={() => setShowAddModal(true)}>
            <div className="profile-avatar profile-avatar--add">
              <Plus size={40} />
            </div>
            <span className="profile-name">Add Profile</span>
          </button>
        )}
      </div>

      <button type="button" className="profiles-manage" onClick={() => navigate('/profile')}>
        <Settings size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Manage Profiles
      </button>

      {showAddModal && (
        <div className="modal-backdrop glass-panel" style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
          <div className="auth-card glass-panel" style={{ background: '#141414', border: '1px solid #333' }}>
            <h2 className="auth-title">Add Profile</h2>
            <form onSubmit={handleAddProfile} className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Profile Name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="isKids"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="isKids" style={{ cursor: 'pointer' }}>Kids Profile?</label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Continue</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhoIsWatching;
