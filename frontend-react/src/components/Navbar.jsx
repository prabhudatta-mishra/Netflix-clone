import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';

const Navbar = ({ onSearch }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLink = (path, label) => (
    <Link
      to={path}
      className={`nav-link ${location.pathname === path ? 'nav-link--active' : ''}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className={`netflix-nav ${scrolled ? 'netflix-nav--scrolled' : ''}`}>
      <div className="netflix-nav-left">
        <Link to="/browse" className="netflix-nav-logo">NETFLIX</Link>
        <div className="netflix-nav-links">
          {navLink('/browse', 'Home')}
          {navLink('/watchlist', 'My List')}
          {navLink('/history', 'History')}
          {navLink('/profile', 'Account')}
          {user?.role === 'ADMIN' && navLink('/admin', 'Admin')}
        </div>
      </div>

      <div className="netflix-nav-right">
        {location.pathname === '/browse' && onSearch && <SearchBar onSearch={onSearch} />}
        <NotificationBell />
        <Link to="/profiles" className="nav-profile-chip" title="Switch profile">
          {profile?.emoji ? (
            <span className="nav-profile-avatar" style={{ background: profile.color }}>{profile.emoji}</span>
          ) : null}
          <span>{user?.username}</span>
        </Link>
        <button type="button" className="nav-signout" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
