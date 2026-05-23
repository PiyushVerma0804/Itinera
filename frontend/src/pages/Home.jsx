import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="hero-section">
      <div className="badge">Now in Preview</div>
      <h1>
        Plan Trips Together,<br />
        Experience Seamlessly.
      </h1>
      <p className="subtitle">
        Collaborate with friends in real-time to curate the perfect travel itineraries, split expenses, and coordinate accommodations.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/dashboard" className="btn btn-primary">
          Explore Dashboard
        </Link>
        <Link to="/trip" className="btn btn-secondary">
          Sample Trip Details
        </Link>
      </div>
    </div>
  );
}

export default Home;
