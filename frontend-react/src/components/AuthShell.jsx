import React from 'react';
import { Link } from 'react-router-dom';
import NetflixFooter from './NetflixFooter';

const AuthShell = ({ children, title }) => (
  <div className="auth-page">
    <header className="auth-header">
      <Link to="/" className="auth-logo">NETFLIX</Link>
    </header>
    <main className="auth-main">
      <div className="auth-card glass-panel animate-fade-in">
        {title && <h1 className="auth-title">{title}</h1>}
        {children}
      </div>
    </main>
    <NetflixFooter minimal />
  </div>
);

export default AuthShell;
