import React from 'react';
import { Link } from 'react-router-dom';

const NetflixFooter = ({ minimal = false }) => (
  <footer className={`netflix-footer ${minimal ? 'netflix-footer--minimal' : ''}`}>
    <div className="netflix-footer-inner">
      {!minimal && (
        <p className="footer-questions">Questions? This is a Netflix Clone demo project.</p>
      )}
      <div className="footer-links">
        <span>FAQ</span>
        <span>Help Center</span>
        <span>Account</span>
        <span>Media Center</span>
        <Link to="/login">Sign In</Link>
        <Link to="/register">Join Now</Link>
      </div>
      <p className="footer-copy">© 2026 Netflix Clone — Educational purposes only</p>
    </div>
  </footer>
);

export default NetflixFooter;
