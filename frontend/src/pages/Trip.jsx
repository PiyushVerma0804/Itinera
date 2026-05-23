import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

function Trip() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [allTrips, setAllTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) { setLoading(false); return; }
      try {
        setLoading(true);
        localStorage.setItem('lastOpenedTripId', id);
        const data = await api.get(`/trips/${id}`);
        setTrip(data);
        setNotes(data.notes || '');
        const directory = await api.get('/trips');
        setAllTrips(directory);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, token]);

  const handleNotesBlur = async () => {
    try {
      await api.put(`/trips/${id}`, { notes });
    } catch (err) {
      console.error('Could not save planning notes:', err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const tripDays = (start, end) => {
    const ms = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="skeleton-card" style={{ height: '6rem' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>
          <div className="skeleton-card" style={{ height: '22rem' }}></div>
          <div className="skeleton-card" style={{ height: '14rem' }}></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="empty-state" style={{ padding: '4rem 2rem' }}>
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">Planning space unavailable</h3>
        <p className="empty-state-body">{error || 'This planning space could not be found.'}</p>
        <Link to="/dashboard" className="btn btn-primary">Back to planning hub</Link>
      </div>
    );
  }

  const creator = trip.creator || {};
  const creatorName = creator.name || 'Unknown';
  const creatorEmail = creator.email || '';
  const creatorInitials = creatorName[0]?.toUpperCase() || '?';
  const creatorId = creator._id || (typeof trip.creator === 'string' ? trip.creator : '');
  const currentUserId = user?.id || user?._id;
  const isOrganizer = creatorId && currentUserId && creatorId === currentUserId;
  const otherSpaces = allTrips.filter(t => t._id !== id);

  return (
    <div className="trip-container">

      {/* Breadcrumb + back action */}
      <div className="trip-topbar">
        <div className="breadcrumb">
          <Link to="/dashboard" className="breadcrumb-link">Planning Hub</Link>
          <span className="breadcrumb-sep">›</span>
          <span>{trip.title}</span>
        </div>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">
          ← All spaces
        </Link>
      </div>

      {/* Trip Header */}
      <div className="trip-header">
        <div>
          <div className="trip-status-row">
            <span className="status-dot"></span>
            <span className="status-label">Planning in progress</span>
            <span className="status-divider">·</span>
            <span className="status-meta">{tripDays(trip.startDate, trip.endDate)} days</span>
          </div>
          <h2 className="trip-title">{trip.title}</h2>
          <p className="trip-meta">
            {trip.destination}&nbsp;&nbsp;·&nbsp;&nbsp;{formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="workspace-layout">

        {/* LEFT — Primary planning area */}
        <div className="workspace-main">

          {/* Section: Planning Context */}
          <div className="panel">
            <h3 className="panel-title">Planning context</h3>
            <p className="panel-body">
              This is the shared planning space for your journey to <strong>{trip.destination}</strong>. Use it to align on ideas, capture decisions, and keep your group's travel intent in one place.
            </p>
            <div className="context-chips">
              <span className="chip">{trip.destination}</span>
              <span className="chip">{tripDays(trip.startDate, trip.endDate)}-day journey</span>
              <span className="chip">{isOrganizer ? 'You organized this' : 'Co-planner'}</span>
            </div>
          </div>

          {/* Section: Group Notes & Ideas */}
          <div className="panel">
            <h3 className="panel-title">Group notes & ideas</h3>
            <p className="panel-hint">
              Drop ideas, open questions, and decisions your group is working through. Saved when you click away.
            </p>
            <textarea
              className="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="What's your group considering? Add destinations to discuss, questions to answer, or things to decide before booking…"
              id="textarea-group-notes"
            />
          </div>

          {/* Section: Coming next */}
          <div className="panel panel-muted">
            <h3 className="panel-title">Coming in the next phase</h3>
            <div className="roadmap-list">
              <div className="roadmap-item">
                <span className="roadmap-icon">🗓</span>
                <div>
                  <div className="roadmap-item-title">Day-by-day itinerary builder</div>
                  <div className="roadmap-item-desc">Plan each day as a group — activities, timing, and logistics.</div>
                </div>
                <span className="roadmap-badge">Next up</span>
              </div>
              <div className="roadmap-item">
                <span className="roadmap-icon">💰</span>
                <div>
                  <div className="roadmap-item-title">Group budget coordination</div>
                  <div className="roadmap-item-desc">Align on budgets, split costs, and track shared expenses.</div>
                </div>
                <span className="roadmap-badge">Upcoming</span>
              </div>
              <div className="roadmap-item">
                <span className="roadmap-icon">👥</span>
                <div>
                  <div className="roadmap-item-title">Co-planner invites</div>
                  <div className="roadmap-item-desc">Bring your group into the planning space to decide together.</div>
                </div>
                <span className="roadmap-badge">Upcoming</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — Sidebar */}
        <div className="workspace-sidebar">

          {/* Who organized this */}
          <div className="sidebar-section">
            <div className="sidebar-label">Organized by</div>
            <div className="sidebar-card">
              <div className="planner-row">
                <div className="avatar">{creatorInitials}</div>
                <div>
                  <div className="planner-name">
                    {creatorName}
                    {isOrganizer && <span className="you-badge">you</span>}
                  </div>
                  <div className="planner-email">{creatorEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Co-planners */}
          {trip.members && trip.members.filter(m => m?._id && m._id !== creatorId).length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-label">Co-planners</div>
              <div className="sidebar-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {trip.members
                    .filter(m => m?._id && m._id !== creatorId)
                    .map(member => {
                      const name = member.name || 'Unnamed';
                      return (
                        <div key={member._id} className="planner-row">
                          <div className="avatar avatar-muted">{name[0]?.toUpperCase()}</div>
                          <span className="planner-name">{name}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Journey details */}
          <div className="sidebar-section">
            <div className="sidebar-label">Journey details</div>
            <div className="sidebar-card sidebar-details">
              <div className="detail-row">
                <span className="detail-key">Destination</span>
                <span className="detail-val">{trip.destination}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Departure</span>
                <span className="detail-val">{formatDate(trip.startDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Return</span>
                <span className="detail-val">{formatDate(trip.endDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Duration</span>
                <span className="detail-val">{tripDays(trip.startDate, trip.endDate)} days</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Your role</span>
                <span className="detail-val">{isOrganizer ? 'Organizer' : 'Co-planner'}</span>
              </div>
            </div>
          </div>

          {/* Other planning spaces */}
          {otherSpaces.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-label">Other spaces</div>
              <div className="sidebar-card sidebar-switcher">
                {otherSpaces.map(t => (
                  <Link
                    key={t._id}
                    to={`/trip/${t._id}`}
                    className="switcher-item"
                    id={`switcher-${t._id}`}
                  >
                    <span className="switcher-dot"></span>
                    <span className="switcher-name">{t.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Trip;
