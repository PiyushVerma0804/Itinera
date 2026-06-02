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

  // Preference System states
  const [preferencesList, setPreferencesList] = useState([]);
  const [totalPlanners, setTotalPlanners] = useState(0);
  const [totalSubmitted, setTotalSubmitted] = useState(0);
  const [groupInsights, setGroupInsights] = useState(null);

  // My preferences form fields
  const [myBudget, setMyBudget] = useState('Moderate');
  const [myStyle, setMyStyle] = useState('Mixed');
  const [myFoods, setMyFoods] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [myNotes, setMyNotes] = useState('');

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');
  const [prefsError, setPrefsError] = useState('');

  // Workspace Navigation tab selector
  const [activeTab, setActiveTab] = useState('planning-board');

  // Planning Board States
  const [planningItems, setPlanningItems] = useState([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningError, setPlanningError] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Place');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [addError, setAddError] = useState('');

  // Editing States
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Place');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Category Filtering selector: 'All', 'Places', 'Food', 'Activities', 'Ideas'
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchPreferences = async () => {
    try {
      const data = await api.get(`/trips/${id}/preferences`);
      setPreferencesList(data.preferences || []);
      setTotalPlanners(data.totalMembers || 0);
      setTotalSubmitted(data.totalSubmitted || 0);
      setGroupInsights(data.insights || null);

      const currentUserId = user?.id || user?._id;
      const myProfile = data.preferences?.find(
        p => (p.user?._id || p.user) === currentUserId
      );
      if (myProfile) {
        setMyBudget(myProfile.budgetRange || 'Moderate');
        setMyStyle(myProfile.travelStyle || 'Mixed');
        setMyFoods(myProfile.foodPreferences || []);
        setMyActivities(myProfile.activityPreferences || []);
        setMyNotes(myProfile.notes || '');
      }
    } catch (err) {
      console.error('Could not fetch preferences:', err);
    }
  };

  const fetchPlanningItems = async () => {
    try {
      setPlanningLoading(true);
      const data = await api.get(`/trips/${id}/planning`);
      setPlanningItems(data || []);
      setPlanningError('');
    } catch (err) {
      console.error('Could not fetch planning items:', err);
      setPlanningError(err.message || 'Could not load planning board.');
    } finally {
      setPlanningLoading(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefsSuccess('');
    setPrefsError('');
    setSavingPrefs(true);

    try {
      await api.post(`/trips/${id}/preferences`, {
        budgetRange: myBudget,
        travelStyle: myStyle,
        foodPreferences: myFoods,
        activityPreferences: myActivities,
        notes: myNotes
      });
      setPrefsSuccess('Preferences shared with the group!');
      setTimeout(() => setPrefsSuccess(''), 4000);
      await fetchPreferences();
    } catch (err) {
      setPrefsError(err.message || 'Could not save travel preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const FOOD_OPTIONS = ['Street Food', 'Local Cuisine', 'Cafes', 'Fine Dining', 'Vegetarian', 'Vegan'];
  const ACTIVITY_OPTIONS = ['Nature', 'Trekking', 'Nightlife', 'Shopping', 'Photography', 'Culture', 'Beaches', 'Road Trips'];

  const toggleFood = (food) => {
    if (myFoods.includes(food)) {
      setMyFoods(myFoods.filter(f => f !== food));
    } else {
      setMyFoods([...myFoods, food]);
    }
  };

  const toggleActivity = (activity) => {
    if (myActivities.includes(activity)) {
      setMyActivities(myActivities.filter(a => a !== activity));
    } else {
      setMyActivities([...myActivities, activity]);
    }
  };

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
        await fetchPreferences();
        await fetchPlanningItems();
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

  const handleAddPlanningItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setAddingItem(true);
    setAddError('');
    try {
      await api.post(`/trips/${id}/planning`, {
        category: newItemCategory,
        title: newItemTitle,
        description: newItemDescription,
      });
      setNewItemTitle('');
      setNewItemDescription('');
      setNewItemCategory('Place');
      await fetchPlanningItems();
    } catch (err) {
      setAddError(err.message || 'Could not add idea.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleToggleInterest = async (itemId) => {
    const originalItems = [...planningItems];

    // Optimistic Update
    setPlanningItems(prev => {
      return prev.map(item => {
        if (item._id === itemId) {
          const hasVoted = item.hasVoted;
          return {
            ...item,
            hasVoted: !hasVoted,
            voteCount: hasVoted ? item.voteCount - 1 : item.voteCount + 1
          };
        }
        return item;
      }).sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });

    try {
      const res = await api.post(`/planning/${itemId}/vote`);
      setPlanningItems(prev => {
        return prev.map(item => {
          if (item._id === itemId) {
            return {
              ...item,
              voteCount: res.voteCount,
              hasVoted: res.hasVoted
            };
          }
          return item;
        }).sort((a, b) => {
          if (b.voteCount !== a.voteCount) {
            return b.voteCount - a.voteCount;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
    } catch (err) {
      console.error('Could not toggle interest:', err);
      setPlanningItems(originalItems);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditCategory(item.category);
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    setEditError('');
    try {
      await api.put(`/planning/${editingItem._id}`, {
        title: editTitle,
        description: editDescription,
        category: editCategory
      });
      setEditingItem(null);
      await fetchPlanningItems();
    } catch (err) {
      setEditError(err.message || 'Could not save updates.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePlanningItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this planning item?')) {
      try {
        await api.delete(`/planning/${itemId}`);
        setPlanningItems(prev => prev.filter(item => item._id !== itemId));
      } catch (err) {
        alert(err.message || 'Could not delete item.');
      }
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

      {/* Workspace Navigation tabs */}
      <div className="workspace-tabs-nav" style={{
        display: 'flex',
        gap: '0.25rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'planning-board', label: 'Planning Board' },
          { id: 'preferences', label: 'Travel Preferences' },
          { id: 'people', label: 'People' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
              backgroundColor: activeTab === tab.id ? 'var(--accent-glow)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panes (State preserved using style-toggles) */}
      <div className="tab-content-container">

        {/* TAB 1: OVERVIEW */}
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <div className="workspace-layout">
            <div className="workspace-main">
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
            </div>
            
            <div className="workspace-sidebar">
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

        {/* TAB 2: PLANNING BOARD */}
        <div style={{ display: activeTab === 'planning-board' ? 'block' : 'none' }}>
          
          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}>
            {['All', 'Places', 'Food', 'Activities', 'Ideas'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: activeFilter === filter ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                  backgroundColor: activeFilter === filter ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  color: activeFilter === filter ? 'var(--accent-color)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="workspace-layout">
            
            {/* Collaborative stack on Left */}
            <div className="workspace-main">
              {planningLoading ? (
                <div className="skeleton-card" style={{ height: '10rem' }}>
                  <div className="skeleton-title"></div>
                  <div className="skeleton-line medium"></div>
                  <div className="skeleton-line short"></div>
                </div>
              ) : planningError ? (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{planningError}</div>
              ) : planningItems.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3.5rem 2rem',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-secondary)',
                  boxShadow: 'var(--shadow-xs)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💡</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Start Planning Together</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                    No ideas have been added yet.<br />
                    Start by suggesting places, food, activities, or general trip ideas.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    { id: 'Place', label: 'Places To Explore', filterName: 'Places', emptyMsg: 'No places suggested yet.' },
                    { id: 'Food', label: 'Food To Try', filterName: 'Food', emptyMsg: 'No food suggested yet.' },
                    { id: 'Activity', label: 'Activities', filterName: 'Activities', emptyMsg: 'No activities suggested yet.' },
                    { id: 'General Idea', label: 'General Ideas', filterName: 'Ideas', emptyMsg: 'No general ideas suggested yet.' }
                  ]
                    .filter(cat => activeFilter === 'All' || cat.filterName === activeFilter)
                    .map(cat => {
                      const itemsInCat = planningItems.filter(item => item.category === cat.id);
                      return (
                        <div key={cat.id} className="panel" style={{ padding: '1.5rem' }}>
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: '1.25rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            paddingBottom: '0.6rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{cat.label}</span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--accent-color)',
                              backgroundColor: 'var(--accent-glow)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '99px'
                            }}>
                              {itemsInCat.length} {itemsInCat.length === 1 ? 'idea' : 'ideas'}
                            </span>
                          </h4>
                          
                          {itemsInCat.length === 0 ? (
                            <div style={{
                              padding: '1.5rem',
                              textAlign: 'center',
                              backgroundColor: 'var(--bg-muted)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px dashed var(--border-color)',
                              color: 'var(--text-tertiary)',
                              fontSize: '0.85rem',
                              fontStyle: 'italic'
                            }}>
                              {cat.emptyMsg}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                              {itemsInCat.map(item => {
                                const itemCreator = item.createdBy || {};
                                const itemCreatorName = itemCreator.name || 'Co-planner';
                                const canEditOrDelete = (itemCreator._id || itemCreator) === currentUserId;
                                return (
                                  <div key={item._id} className="sidebar-card" style={{
                                    padding: '1.15rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '1.5rem',
                                    boxShadow: 'var(--shadow-xs)',
                                    transition: 'var(--transition)'
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h5 style={{
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.4rem',
                                        letterSpacing: '-0.01em'
                                      }}>{item.title}</h5>
                                      {item.description && (
                                        <p style={{
                                          fontSize: '0.85rem',
                                          color: 'var(--text-secondary)',
                                          marginBottom: '0.75rem',
                                          lineHeight: 1.5,
                                          whiteSpace: 'pre-wrap'
                                        }}>{item.description}</p>
                                      )}
                                      <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-tertiary)'
                                      }}>
                                        <span>Added by <strong>{itemCreatorName}</strong></span>
                                        <span>•</span>
                                        <span>{formatDate(item.createdAt)}</span>
                                      </div>
                                    </div>
                                    
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      gap: '0.65rem',
                                      flexShrink: 0
                                    }}>
                                      <button
                                        onClick={() => handleToggleInterest(item._id)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          padding: '0.35rem 0.75rem',
                                          borderRadius: 'var(--radius-sm)',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          border: '1px solid ' + (item.hasVoted ? 'rgba(234, 88, 12, 0.25)' : 'var(--border-color)'),
                                          backgroundColor: item.hasVoted ? 'var(--accent-glow)' : 'var(--bg-muted)',
                                          color: item.hasVoted ? 'var(--accent-color)' : 'var(--text-secondary)',
                                          transition: 'var(--transition)'
                                        }}
                                      >
                                        <span>❤️</span>
                                        <span>{item.voteCount} Interested</span>
                                      </button>
                                      
                                      {canEditOrDelete && (
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                          <button
                                            onClick={() => handleStartEdit(item)}
                                            style={{
                                              padding: '0.2rem 0.5rem',
                                              fontSize: '0.7rem',
                                              fontWeight: 600,
                                              border: '1px solid var(--border-color)',
                                              backgroundColor: 'var(--bg-secondary)',
                                              color: 'var(--text-secondary)',
                                              borderRadius: 'var(--radius-sm)',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeletePlanningItem(item._id)}
                                            style={{
                                              padding: '0.2rem 0.5rem',
                                              fontSize: '0.7rem',
                                              fontWeight: 600,
                                              border: '1px solid #fca5a5',
                                              backgroundColor: '#fef2f2',
                                              color: '#dc2626',
                                              borderRadius: 'var(--radius-sm)',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Side-panel Form on Right */}
            <div className="workspace-sidebar">
              <div className="panel" style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                position: 'sticky',
                top: '80px'
              }}>
                <h4 style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  marginBottom: '1rem',
                  letterSpacing: '0.05em'
                }}>Add to Board</h4>
                {addError && <div className="alert alert-error" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }}>{addError}</div>}
                <form onSubmit={handleAddPlanningItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      style={{
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        outline: 'none',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <option value="Place">Place To Explore</option>
                      <option value="Food">Food To Try</option>
                      <option value="Activity">Activity</option>
                      <option value="General Idea">General Idea</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Title</label>
                    <input
                      type="text"
                      required
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="e.g., Tiger Hill Sunrise"
                      style={{
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Description (Optional)</label>
                    <textarea
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="e.g., Early morning viewpoint recommendation."
                      style={{
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        height: '5rem',
                        outline: 'none',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                        fontFamily: 'var(--font-sans)'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
                  >
                    {addingItem ? 'Adding...' : 'Suggest Idea'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>

        {/* TAB 3: TRAVEL PREFERENCES */}
        <div style={{ display: activeTab === 'preferences' ? 'block' : 'none' }}>
          <div className="panel" style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Travel Preferences</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {totalSubmitted} of {totalPlanners} planners have shared preferences
              </span>
            </div>

            <div className="preferences-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem' }}>
              
              {/* LEFT SIDE - My Preferences Form */}
              <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>My Preferences</h4>
                
                {!preferencesList.some(p => (p.user?._id || p.user) === (user?.id || user?._id)) && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', fontStyle: 'italic' }}>
                    Share your travel preferences if you'd like the group to better understand what kind of experience you're looking for.
                  </p>
                )}

                {prefsSuccess && <div className="alert alert-success" style={{ color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem' }}>{prefsSuccess}</div>}
                {prefsError && <div className="alert alert-error" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }}>{prefsError}</div>}

                <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Budget Range</label>
                    <select
                      value={myBudget}
                      onChange={(e) => setMyBudget(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', outline: 'none', fontSize: '0.85rem' }}
                    >
                      <option value="Budget">Budget</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Travel Style</label>
                    <select
                      value={myStyle}
                      onChange={(e) => setMyStyle(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', outline: 'none', fontSize: '0.85rem' }}
                    >
                      <option value="Relaxed">Relaxed</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Exploration">Exploration</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Food Preferences</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {FOOD_OPTIONS.map(food => {
                        const isSelected = myFoods.includes(food);
                        return (
                          <button
                            key={food}
                            type="button"
                            onClick={() => toggleFood(food)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '99px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                              color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                          >
                            {food}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Activity Preferences</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {ACTIVITY_OPTIONS.map(activity => {
                        const isSelected = myActivities.includes(activity);
                        return (
                          <button
                            key={activity}
                            type="button"
                            onClick={() => toggleActivity(activity)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '99px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                              color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                          >
                            {activity}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Personal Notes</label>
                    <textarea
                      value={myNotes}
                      onChange={(e) => setMyNotes(e.target.value)}
                      placeholder="What matters most to you on this trip? e.g., scenic drives, slow mornings..."
                      style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', height: '4.5rem', outline: 'none', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingPrefs}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {savingPrefs ? 'Sharing...' : 'Share travel preferences'}
                  </button>

                </form>
              </div>

              {/* RIGHT SIDE - Group Preferences & Insights */}
              <div>
                {totalSubmitted > 0 && groupInsights && (
                  <div className="panel panel-muted" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px dashed var(--border-color)' }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>Group Insights</h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Most Common Budget:</span>
                        <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{groupInsights.mostCommonBudget || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Most Common Style:</span>
                        <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{groupInsights.mostCommonTravelStyle || 'N/A'}</strong>
                      </div>
                      {groupInsights.popularActivities && groupInsights.popularActivities.length > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Top Activities:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                            {groupInsights.popularActivities.map(act => (
                              <span key={act} className="chip" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--bg-secondary)' }}>{act}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {groupInsights.popularFoodInterests && groupInsights.popularFoodInterests.length > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Top Food Interests:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                            {groupInsights.popularFoodInterests.map(food => (
                              <span key={food} className="chip" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--bg-secondary)' }}>{food}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>Planning Together</h4>

                {totalSubmitted === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1.5rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-muted)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Travel preferences help everyone understand what kind of experience the group is hoping for. Add yours whenever you're ready.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '35rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {preferencesList.map(pref => {
                      const uName = pref.user?.name || 'Co-planner';
                      const uEmail = pref.user?.email || '';
                      return (
                        <div key={pref._id} className="sidebar-card" style={{ borderLeft: '3px solid var(--accent-color)', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{uName}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{uEmail}</span>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            borderBottom: pref.notes ? '1px solid var(--border-subtle)' : 'none',
                            paddingBottom: pref.notes ? '0.5rem' : '0',
                            marginBottom: pref.notes ? '0.5rem' : '0'
                          }}>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Budget:</span> {pref.budgetRange}
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Style:</span> {pref.travelStyle}
                            </div>
                            {pref.activityPreferences && pref.activityPreferences.length > 0 && (
                              <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.15rem' }}>Activities:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  {pref.activityPreferences.map(a => (
                                    <span key={a} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: 'var(--bg-muted)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{a}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {pref.foodPreferences && pref.foodPreferences.length > 0 && (
                              <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'block', marginBottom: '0.15rem' }}>Foods:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  {pref.foodPreferences.map(f => (
                                    <span key={f} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: 'var(--bg-muted)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{f}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {pref.notes && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                              "{pref.notes}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* TAB 4: PEOPLE */}
        <div style={{ display: activeTab === 'people' ? 'block' : 'none' }}>
          <div className="workspace-layout">
            
            {/* Left side planning team roster */}
            <div className="workspace-main">
              <div className="panel">
                <h3 className="panel-title" style={{ marginBottom: '1.25rem' }}>Active Planning Team</h3>
                
                {/* Creator Roster details */}
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Workspace Owner</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{creatorName}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{creatorEmail}</div>
                    </div>
                    <span className="role-badge role-badge-host" style={{ fontSize: '0.7rem' }}>Owner</span>
                  </div>
                </div>

                {/* Co-planners Section */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem' }}>Co-planners</span>
                  {trip.members && trip.members.filter((m, idx, self) => 
                    m?._id && 
                    m._id.toString() !== creatorId.toString() &&
                    self.findIndex(t => t?._id?.toString() === m._id.toString()) === idx
                  ).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {trip.members
                        .filter((m, idx, self) => 
                          m?._id && 
                          m._id.toString() !== creatorId.toString() &&
                          self.findIndex(t => t?._id?.toString() === m._id.toString()) === idx
                        )
                        .map(member => {
                          const name = member.name || 'Unnamed';
                          return (
                            <div key={member._id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              backgroundColor: 'var(--bg-muted)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)'
                            }}>
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{name}</strong>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                              </div>
                              {isOrganizer && (
                                <button
                                  onClick={() => handleRemove(member._id, name)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
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
                    <div style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-tertiary)',
                      fontSize: '0.85rem',
                      fontStyle: 'italic'
                    }}>
                      No co-planners yet. Invite others to start planning as a team!
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right side invite controls */}
            <div className="workspace-sidebar">
              <div className="panel">
                <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Invite Co-Planners</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Share this exclusive workspace link with friends, family, or travel buddies to let them join your planning board and travel preferences.
                </p>

                {inviteError ? (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem' }}>{inviteError}</div>
                ) : inviteLink ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      style={{
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.8rem',
                        backgroundColor: 'var(--bg-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        width: '100%',
                        fontWeight: 500,
                        color: 'var(--text-secondary)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                          style={{ padding: '0.2rem 0.75rem', fontSize: '0.75rem' }}
                          title="Regenerate link code"
                          id="btn-regenerate-link"
                        >
                          Reset Link
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
        </div>

      </div>

      {/* Editing Modal Dialog Overlay */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="panel" style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: '1.75rem'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              color: 'var(--text-primary)'
            }}>Edit Suggestion</h3>
            {editError && <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>{editError}</div>}
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  <option value="Place">Place To Explore</option>
                  <option value="Food">Food To Try</option>
                  <option value="Activity">Activity</option>
                  <option value="General Idea">General Idea</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                  placeholder="e.g. Tiger Hill Sunrise"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Description (Optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    height: '5.5rem',
                    outline: 'none',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    fontFamily: 'var(--font-sans)'
                  }}
                  placeholder="e.g. Early morning viewpoint recommendation."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={() => setEditingItem(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={savingEdit} className="btn btn-primary btn-sm">{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Trip;
