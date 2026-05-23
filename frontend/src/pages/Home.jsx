import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="hero-section" style={{ minHeight: '70vh', padding: '4rem 1rem' }}>
      <div className="badge">Welcome to Itinera</div>
      <h1 style={{ maxWidth: '720px', margin: '0 auto 1.5rem', lineHeight: '1.2' }}>
        Plan trips together,<br />
        experience seamlessly.
      </h1>
      <p className="subtitle" style={{ maxWidth: '540px', margin: '0 auto 3rem' }}>
        A calm collaborative planning workspace for organizing group journeys, sharing timelines, and coordinating trip details.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/register" className="btn btn-primary" style={{ padding: '0.8rem 2.25rem', fontSize: '1rem', borderRadius: '8px', fontWeight: 700 }}>
          Start Planning
        </Link>
        <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={(e) => e.target.style.color = 'var(--accent-color)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
          Sign in to existing account
        </Link>
      </div>
    </div>
  );
}

export default Home;
