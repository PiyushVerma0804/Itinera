import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

function Home() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="hero-section">
      <div className="badge">
        Group travel, planned together
      </div>

      <h1>
        Stop juggling group travel.<br />
        Start deciding together.
      </h1>

      <p className="subtitle">
        Itinera gives your group a shared space to align on destinations, coordinate plans, and move from ideas to a confirmed journey — together.
      </p>

      <div className="hero-actions">
        <Link to="/register" className="btn btn-primary btn-lg" id="cta-start-planning">
          Start planning for free
        </Link>
        <Link to="/login" className="hero-signin-link">
          Already planning? Sign in
        </Link>
      </div>

      <div className="hero-social-proof">
        <span>Built for groups who want to stop over-planning and actually travel.</span>
      </div>
    </div>
  );
}

export default Home;
