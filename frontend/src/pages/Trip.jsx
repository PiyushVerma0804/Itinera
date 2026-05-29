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
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchInviteLink = async () => {
    try {
      const data = await api.get(`/trips/${id}/invite-link`);
      setInviteLink(data.inviteUrl);
    } catch (err) {
      setInviteError(err.message || 'Could not fetch invite link.');
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateInviteLink = async () => {
    if (window.confirm('Regenerate invite link? The previous link will stop working immediately.')) {
      try {
        const data = await api.post(`/trips/${id}/invite-link/regenerate`);
        setInviteLink(data.inviteUrl);
        setInviteSuccess('Regenerated!');
        setTimeout(() => setInviteSuccess(''), 2000);
      } catch (err) {
        setInviteError(err.message || 'Could not regenerate invite link.');
      }
    }
  };

  const handleRemove = async (memberId, name) => {
    if (window.confirm(`Remove ${name} from this planning team?`)) {
      try {
        const updatedTrip = await api.delete(`/trips/${id}/members/${memberId}`);
        setTrip(updatedTrip);
      } catch (err) {
        alert(err.message || 'Failed to remove member.');
      }
    }
  };

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
        try {
          const inviteData = await api.get(`/trips/${id}/invite-link`);
          setInviteLink(inviteData.inviteUrl);
        } catch (linkErr) {
          console.error("Could not load invite link", linkErr);
        }
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

          {/* People / Planning Team */}
          <div className="sidebar-section">
            <div className="sidebar-label">Planning Team</div>
            <div className="sidebar-card">
              {/* Workspace Owner */}
              <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Workspace Owner</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{creatorName}</span>
                  <span className="role-badge role-badge-host" style={{ fontSize: '0.65rem' }}>Owner</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{creatorEmail}</div>
              </div>

              {/* Members */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Co-planners</div>
                {trip.members && trip.members.filter((m, idx, self) => 
                  m?._id && 
                  m._id.toString() !== creatorId.toString() &&
                  self.findIndex(t => t?._id?.toString() === m._id.toString()) === idx
                ).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {trip.members
                      .filter((m, idx, self) => 
                        m?._id && 
                        m._id.toString() !== creatorId.toString() &&
                        self.findIndex(t => t?._id?.toString() === m._id.toString()) === idx
                      )
                      .map(member => {
                        const name = member.name || 'Unnamed';
                        return (
                          <div key={member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <div>
                              <div style={{ fontWeight: 500 }}>{name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                            </div>
                            {isOrganizer && (
                              <button
                                onClick={() => handleRemove(member._id, name)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                                id={`btn-remove-${member._id}`}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No co-planners yet.</div>
                )}
              </div>

              {/* Invite Others / Share Planning Link */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Invite Others</div>
                {inviteError ? (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem' }}>{inviteError}</div>
                ) : inviteLink ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={handleCopyLink}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        id="btn-copy-link"
                      >
                        {copied ? 'Copied! ✓' : 'Copy Link'}
                      </button>
                      {isOrganizer && (
                        <button
                          onClick={handleRegenerateInviteLink}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          title="Regenerate link code"
                          id="btn-regenerate-link"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    {inviteSuccess && (
                      <div style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '0.25rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {inviteSuccess}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Loading invite link...</div>
                )}
              </div>

            </div>
          </div>

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
