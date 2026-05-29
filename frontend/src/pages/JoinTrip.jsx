import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

function JoinTrip() {
  const { inviteCode } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const performJoin = async () => {
      if (!token) {
        // User not logged in: save the join code and redirect
        localStorage.setItem('pendingJoinInviteCode', inviteCode);
        navigate('/login', { replace: true });
        return;
      }

      try {
        const trip = await api.post(`/trips/join/${inviteCode}`);
        // Clear pending code once joined
        localStorage.removeItem('pendingJoinInviteCode');
        navigate(`/trip/${trip._id}`, { replace: true });
      } catch (err) {
        setError(err.message || 'Unable to join the trip. The link may be invalid.');
      }
    };

    performJoin();
  }, [inviteCode, token, navigate]);

  if (error) {
    return (
      <div className="empty-state" style={{ padding: '4rem 2rem' }}>
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">Could not join planning space</h3>
        <p className="empty-state-body">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Go to planning hub
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
      <div className="skeleton-row" style={{ width: '4rem', height: '4rem', borderRadius: '50%' }}></div>
      <h3 style={{ fontWeight: 600 }}>Joining planning space...</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We're adding you to the planning team.</p>
    </div>
  );
}

export default JoinTrip;
