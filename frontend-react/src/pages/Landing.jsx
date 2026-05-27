import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NetflixFooter from '../components/NetflixFooter';
import { Play, ChevronRight } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/browse" replace />;
  }

  return (
    <div className="landing-page">
      <div className="landing-hero-bg" />
      <div className="landing-gradient" />

      <header className="landing-header">
        <span className="landing-logo">NETFLIX</span>
        <div className="landing-header-actions">
          <Link to="/login" className="btn-secondary landing-btn-signin">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </header>

      <section className="landing-hero">
        <h1>Unlimited movies, TV shows, and more</h1>
        <p className="landing-sub">Watch anywhere. Cancel anytime. Personalized rows powered by Netflix-style algorithms.</p>
        <p className="landing-cta-text">Ready to watch? Enter your email to create or restart your membership.</p>
        <div className="landing-email-row">
          <input type="email" placeholder="Email address" className="landing-email-input" readOnly onFocus={(e) => e.target.blur()} />
          <Link to="/register" className="btn-primary landing-get-started">
            Get Started <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      <section className="landing-features">
        <Feature
          title="Continue Watching"
          desc="Resume where you left off — progress saved automatically like Netflix."
        />
        <Feature
          title="Top Picks For You"
          desc="Personalized ranking: genre affinity, ratings, and collaborative filtering."
        />
        <Feature
          title="Trending & Genre Rows"
          desc="Popularity-based trending, top rated, new releases, and smart genre shelves."
        />
        <Feature
          title="Adaptive Streaming"
          desc="Byte-range video streaming from your server — same playback model as Netflix CDN."
        />
      </section>

      <section className="landing-banner-cta">
        <h2>Watch on any device. Start now.</h2>
        <Link to="/register" className="btn-primary landing-play-cta">
          <Play size={22} fill="#fff" /> Start Watching
        </Link>
      </section>

      <NetflixFooter />
    </div>
  );
};

const Feature = ({ title, desc }) => (
  <div className="landing-feature-card glass-panel">
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

export default Landing;
