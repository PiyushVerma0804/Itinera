import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for creating a new trip
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await api.get('/trips');
      setTrips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [token]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !destination || !startDate || !endDate) {
      setFormError('Please fill out all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date');
      return;
    }

    try {
      setCreating(true);
      await api.post('/trips', {
        title,
        destination,
        startDate,
        endDate,
      });

      // Reset form and re-fetch trips
      setTitle('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setShowForm(false);
      fetchTrips();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Find the most recent trip to continue planning
  const latestTrip = trips.length > 0 ? trips[0] : null;

  return (
    <div className="dashboard-container">
      {/* Top Area: Minimal Navigation Breadcrumb & Context */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
        Workspace / My Trips
      </div>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '1.9rem', marginBottom: '0.25rem' }}>
            My Active Workspaces
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Coordinate itineraries and manage active coordination platforms.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
        >
          {showForm ? 'Close Form' : '+ Plan New Trip'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem',
          marginBottom: '2rem'
        }}>
          Error loading travel workspace: {error}
        </div>
      )}

      {/* Primary Action Area: Continuation Flow */}
      {!loading && !showForm && latestTrip && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
            Continue Planning
          </h3>
          <div className="continue-planning-card">
            <div>
              <span className="badge" style={{ margin: 0, marginBottom: '0.5rem', padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>
                Most Recent Active Workspace
              </span>
              <h4 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                {latestTrip.title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.1rem' }}>
                Destination: {latestTrip.destination} | Dates: {formatDate(latestTrip.startDate)} - {formatDate(latestTrip.endDate)}
              </p>
            </div>
            <Link to={`/trip/${latestTrip._id}`} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              Resume Planning →
            </Link>
          </div>
        </div>
      )}

      {/* Inline Trip Creation Form (collapsible, simple visual widget) */}
      {showForm && (
        <div className="skeleton-card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Plan a New Journey
          </h3>
          
          {formError && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#ef4444',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateTrip} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: 'span 2' }}>
              <label>Trip Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer in Tokyo"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: 'span 2' }}>
              <label>Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Tokyo, Japan"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? 'Saving...' : 'Add Trip to Workspace'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Row-Based Workspace List Area */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          All Travel Workspaces
        </h3>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map((n) => (
              <div key={n} className="skeleton-card">
                <div className="skeleton-title" style={{ width: '40%' }}></div>
                <div className="skeleton-line"></div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="skeleton-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Your Workspace is Empty
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 2rem' }}>
              No travel itineraries found in your current workspace. Begin planning your next journey together.
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Plan your first trip
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="workspace-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Trip Title & Destination</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Travel Dates</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Planners</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const isHost = trip.creator._id === user?.id || trip.creator === user?.id;
                  return (
                    <tr key={trip._id} className="trip-row">
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{trip.title}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>Destination: {trip.destination}</div>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <span className="badge" style={{ margin: 0, padding: '0.2rem 0.6rem', fontSize: '0.7rem', textTransform: 'none', backgroundColor: isHost ? 'var(--accent-glow)' : 'var(--bg-tertiary)', color: isHost ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none' }}>
                          {isHost ? 'Owner' : 'Member'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {trip.members ? trip.members.length : 1}
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <Link to={`/trip/${trip._id}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-color)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                          Open Workspace →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
