import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setFormError('Fill in all fields to continue');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date must be before end date');
      return;
    }

    try {
      setCreating(true);
      const data = await api.post('/trips', { title, destination, startDate, endDate });
      setTitle('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setShowForm(false);
      navigate(`/trip/${data._id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const lastOpenedId = localStorage.getItem('lastOpenedTripId');
  const activeTrip = trips.find(t => t._id === lastOpenedId) || (trips.length > 0 ? trips[0] : null);

  return (
    <div className="dashboard-container">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        Planning Hub
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Your planning spaces</h2>
          <p className="page-subtitle">
            Pick up where you left off, or bring a new journey to life.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          id="btn-new-journey"
        >
          {showForm ? 'Never mind' : '+ New journey'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          Couldn't reach your planning spaces: {error}
        </div>
      )}

      {/* Inline Journey Creation */}
      {showForm && (
        <div className="panel panel-accent" style={{ marginBottom: '2rem' }}>
          <h3 className="panel-title">Where are you headed?</h3>
          <p className="panel-subtitle">Give your group journey a name and a destination to get started.</p>

          {formError && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateTrip} className="trip-form">
            <div className="form-group form-group-full">
              <label className="form-label">Journey name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Golden Week in Kyoto"
                className="form-input"
                id="input-journey-title"
              />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Kyoto, Japan"
                className="form-input"
                id="input-journey-destination"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departure date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                id="input-journey-start"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Return date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                id="input-journey-end"
              />
            </div>

            <div className="form-actions">
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
                id="btn-create-journey"
              >
                {creating ? 'Opening workspace…' : 'Open planning space →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Continue Planning — Active Journey */}
      {!loading && !showForm && activeTrip && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Continue planning</div>
          <div className="continue-card">
            <div className="continue-card-body">
              <div className="continue-card-tag">Where you left off</div>
              <h3 className="continue-card-title">{activeTrip.title}</h3>
              <p className="continue-card-meta">
                {activeTrip.destination} &nbsp;·&nbsp; {formatDate(activeTrip.startDate)} – {formatDate(activeTrip.endDate)}
              </p>
            </div>
            <Link
              to={`/trip/${activeTrip._id}`}
              className="btn btn-primary"
              id="btn-resume-planning"
            >
              Resume planning →
            </Link>
          </div>
        </div>
      )}

      {/* Active Planning Spaces */}
      <div>
        <div className="section-label">
          {loading ? 'Loading…' : trips.length === 0 ? 'No active spaces' : `Active planning spaces (${trips.length})`}
        </div>

        {loading ? (
          <div className="skeleton-list">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <h3 className="empty-state-title">No journeys in progress</h3>
            <p className="empty-state-body">
              Create your first group planning space and invite others to start deciding together.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
              id="btn-first-journey"
            >
              Plan your first journey
            </button>
          </div>
        ) : (
          <div className="journey-list">
            {trips.map((trip) => {
              const creatorId = trip.creator?._id || trip.creator;
              const currentUserId = user?.id || user?._id;
              const isHost = creatorId && currentUserId && creatorId === currentUserId;
              return (
                <div key={trip._id} className="journey-row">
                  <div className="journey-row-info">
                    <div className="journey-row-header">
                      <span className="journey-row-title">{trip.title}</span>
                      <span className={`role-badge ${isHost ? 'role-badge-host' : 'role-badge-member'}`}>
                        {isHost ? 'Organizer' : 'Co-planner'}
                      </span>
                    </div>
                    <div className="journey-row-meta">
                      {trip.destination}&nbsp;·&nbsp;{formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </div>
                  </div>
                  <Link
                    to={`/trip/${trip._id}`}
                    className="journey-row-action"
                    id={`btn-open-${trip._id}`}
                  >
                    Open space →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
