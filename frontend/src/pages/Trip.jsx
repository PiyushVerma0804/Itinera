import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

function Trip() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local state for Planning Notes (lightweight textarea)
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.get(`/trips/${id}`);
        setTrip(data);
        
        // Initial notes seed (simulate loading local notes if exists or set placeholder)
        setNotes('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, token]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper to calculate duration in days
  const calculateDuration = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // inclusive
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="skeleton-card" style={{ height: '7rem' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div className="skeleton-card" style={{ height: '20rem' }}></div>
          <div className="skeleton-card" style={{ height: '14rem' }}></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="skeleton-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444', marginBottom: '1rem' }}>
          Error Loading Trip
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {error || 'No active trip details selected.'}
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="trip-container">
      {/* Top Header Section: Breadcrumb & Context */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
        Workspace / Trips / {trip.title}
      </div>
      
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <span className="badge" style={{ marginBottom: '0.4rem', border: 'none', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)' }}>
            In Planning
          </span>
          <h2 className="page-title" style={{ fontSize: '1.80rem' }}>{trip.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
            Destination: {trip.destination} | Dates: {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
        </div>
        <Link to="/trips" className="btn btn-secondary" style={{ fontWeight: 600 }}>
          Back to Workspaces
        </Link>
      </div>

      {/* Main Workspace Flow Split Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Primary Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          
          {/* SECTION 1: Trip Overview */}
          <div className="skeleton-card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Trip Overview
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Welcome to the central itinerary coordination space for your journey to {trip.destination}. Use the workspace tools below to draft coordination plans, compile notes, and manage active participant listings.
            </p>
          </div>

          {/* SECTION 2: Planning Notes */}
          <div className="skeleton-card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Planning Notes
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
              Use this space for planning ideas, reminders, and trip coordination notes.
            </p>
            <textarea
              className="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Start drafting planning notes here..."
            />
          </div>

          {/* SECTION 3: Upcoming Modules (Roadmap-style list rows) */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Upcoming Modules
            </h3>
            
            <div className="roadmap-row">
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Itinerary Planning</span>
              <span className="roadmap-badge">Planned for upcoming phase</span>
            </div>

            <div className="roadmap-row">
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Budget Tracking</span>
              <span className="roadmap-badge">Planned for upcoming phase</span>
            </div>

            <div className="roadmap-row">
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Collaboration Controls</span>
              <span className="roadmap-badge">Planned for upcoming phase</span>
            </div>
          </div>
        </div>

        {/* Right Column: Supporting Sidebar (strictly structured) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* 1. Workspace Owner */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              Workspace Owner
            </h3>
            <div className="skeleton-card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem' }}>
                  {trip.creator.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {trip.creator.name}
                    <span className="badge" style={{ margin: 0, padding: '0.1rem 0.4rem', fontSize: '0.65rem', border: 'none', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textTransform: 'none' }}>Owner</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{trip.creator.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Active Planners */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              Active Planners
            </h3>
            <div className="skeleton-card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Always include creator first */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem' }}>
                    {trip.creator.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{trip.creator.name} (Host)</span>
                </div>

                {trip.members && trip.members.filter(m => m._id !== trip.creator._id).map((member) => (
                  <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem' }}>
                      {member.name[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Workspace Details */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              Workspace Details
            </h3>
            <div className="skeleton-card" style={{ backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Created Date</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{formatDate(trip.createdAt || new Date())}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Trip Duration</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{calculateDuration(trip.startDate, trip.endDate)} Days</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Workspace Status</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>Active & Protected</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Trip;
