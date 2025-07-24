import React, { useState, useEffect, useCallback } from 'react';
import { getEvent, deleteEvent, updateEvent } from '../services/eventService';
import { useUser } from '../contexts/UserContext';

const EventDetail = ({ eventId, onRefresh, onEdit, onBack }) => {
  const { canEdit, canDelete, user, isAuthenticated } = useUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    team: '',
    phone: ''
  });
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [liveUpdateTime, setLiveUpdateTime] = useState(Date.now());
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // Available teams for selection
  const availableTeams = [
    'Good Vibes',
    'Sunflowers',
    'Thunders',
    'Dreem Catchers',
    'Flower Power',
    'Queen Bees',
    'Mama Mia'
  ];

  const loadEvent = useCallback(async (isAutoSync = false) => {
    if (!eventId) return;
    
    try {
      if (isAutoSync) {
        setIsAutoSyncing(true);
      } else {
        setLoading(true);
      }
      
      const eventData = await getEvent(eventId);
      setEvent(eventData);
      setError(null);
      
      if (isAutoSync) {
        setLastSyncTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      if (!isAutoSync) {
        setError('Failed to load event');
      }
    } finally {
      if (isAutoSync) {
        setIsAutoSyncing(false);
      } else {
        setLoading(false);
      }
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Live update timer for join timestamps - updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUpdateTime(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh event data every 10 seconds to sync with other users
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvent(true); // Auto-sync mode
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [loadEvent]);

  // Pre-populate admin info when join form is shown
  useEffect(() => {
    if (showJoinForm && isAuthenticated() && user && !user.phone) {
      // Pre-populate name for admin users
      setGuestInfo(prev => ({
        ...prev,
        name: user.username ? `${user.username} (Admin)` : user.name || 'Admin User'
      }));
    }
  }, [showJoinForm, isAuthenticated, user]);

  const handleDelete = async () => {
    const attendeeCount = event.attendees?.length || 0;
    const confirmMessage = attendeeCount > 0 
      ? `Are you sure you want to delete "${event.title}"?\n\nThis will permanently delete:\n• The event\n• All ${attendeeCount} registered attendees\n• All related data from the database\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone.`;
      
    if (window.confirm(confirmMessage)) {
      try {
        await deleteEvent(eventId);
        onRefresh();
        if (onBack) {
          onBack(); // Return to events list
        }
      } catch (error) {
        alert('Failed to delete event. Please try again.');
        console.error('Delete error:', error);
      }
    }
  };

  const handleJoinEvent = async (e) => {
    console.log('🚀 FORM SUBMISSION STARTED!');
    e.preventDefault();
    setJoinLoading(true);

    console.log('🎯 Form submitted with guestInfo:', guestInfo);
    console.log('🎯 User object:', user);
    console.log('🎯 isAuthenticated:', isAuthenticated());

    // Check if form fields are empty at the UI level
    console.log('🔍 Raw form values:', {
      name: `"${guestInfo.name}"`,
      team: `"${guestInfo.team}"`,
      phone: `"${guestInfo.phone}"`
    });

    try {
      let attendeeInfo;
      
      if (isAuthenticated()) {
        // For authenticated users, use form data (which is pre-populated for admin)
        attendeeInfo = {
          name: guestInfo.name.trim() || user.username || user.name || 'Admin User',
          team: guestInfo.team,
          phone: guestInfo.phone.trim(),
          role: user.role || 'admin',
          joinedAt: new Date().toISOString(),
          joinOrder: (event.attendees?.length || 0) + 1
        };
      } else {
        // For guests, use the form data
        attendeeInfo = {
          name: guestInfo.name.trim(),
          team: guestInfo.team,
          phone: guestInfo.phone.trim(),
          role: 'guest',
          joinedAt: new Date().toISOString(),
          joinOrder: (event.attendees?.length || 0) + 1
        };
      }
      
      console.log('🎯 Attempting to join with info:', attendeeInfo);
      
      if (!attendeeInfo.name || !attendeeInfo.team || !attendeeInfo.phone) {
        const missingFields = [];
        if (!attendeeInfo.name) missingFields.push('Name');
        if (!attendeeInfo.team) missingFields.push('Team');
        if (!attendeeInfo.phone) missingFields.push('Phone');
        
        alert(`Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
        console.log('❌ Missing fields:', {
          name: !attendeeInfo.name ? 'MISSING' : attendeeInfo.name,
          team: !attendeeInfo.team ? 'MISSING' : attendeeInfo.team, 
          phone: !attendeeInfo.phone ? 'MISSING' : attendeeInfo.phone
        });
        setJoinLoading(false);
        return;
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
      if (!phoneRegex.test(attendeeInfo.phone)) {
        alert('Please enter a valid phone number');
        setJoinLoading(false);
        return;
      }

      // Check if user is already attending by phone number
      const existingAttendee = event.attendees.find(attendee => 
        attendee.phone === attendeeInfo.phone
      );
      
      if (existingAttendee) {
        alert(`A person with this phone number (${attendeeInfo.phone}) is already registered for this event.`);
        setJoinLoading(false);
        return;
      }

      // Check attendee limit (enforce 20 person maximum)
      const maxAllowed = Math.min(event.maxAttendees || 20, 20);
      if (event.attendees.length >= maxAllowed) {
        alert(`Sorry, this event has reached its maximum capacity of ${maxAllowed} attendees.`);
        setJoinLoading(false);
        return;
      }

      const updatedEvent = {
        ...event,
        attendees: [...event.attendees, attendeeInfo]
      };

      await updateEvent(eventId, updatedEvent);
      setEvent(updatedEvent);
      setShowJoinForm(false);
      setGuestInfo({ name: '', team: '', phone: '' });
      onRefresh();
      
      alert(`Successfully joined the event "${event.title}"!`);
    } catch (error) {
      alert('Failed to join event');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!isAuthenticated()) {
      alert('Unable to identify your registration. Please contact an administrator.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to leave "${event.title}"?`)) {
      try {
        let updatedEvent;
        
        // If user has phone, remove by phone
        if (user.phone) {
          updatedEvent = {
            ...event,
            attendees: event.attendees.filter(attendee => attendee.phone !== user.phone)
          };
        } else {
          // If user doesn't have phone (like admin), remove by name/username
          updatedEvent = {
            ...event,
            attendees: event.attendees.filter(attendee => 
              attendee.name !== user.username && 
              attendee.name !== user.name &&
              attendee.name !== `${user.username} (Admin)`
            )
          };
        }

        await updateEvent(eventId, updatedEvent);
        setEvent(updatedEvent);
        onRefresh();
        
        alert(`You have left the event "${event.title}"`);
      } catch (error) {
        alert('Failed to leave event');
      }
    }
  };

  const handleRemoveAttendee = async (attendeeToRemove) => {
    if (!canEdit()) {
      alert('You do not have permission to remove attendees.');
      return;
    }

    const attendeeName = typeof attendeeToRemove === 'string' ? attendeeToRemove : attendeeToRemove.name;
    
    if (window.confirm(`Are you sure you want to remove "${attendeeName}" from "${event.title}"?`)) {
      try {
        let updatedEvent;
        
        if (typeof attendeeToRemove === 'string') {
          // Legacy format - remove by name
          updatedEvent = {
            ...event,
            attendees: event.attendees.filter(attendee => attendee !== attendeeToRemove)
          };
        } else {
          // New format - remove by phone or name
          updatedEvent = {
            ...event,
            attendees: event.attendees.filter(attendee => {
              if (typeof attendee === 'string') {
                return attendee !== attendeeToRemove.name;
              }
              return attendee.phone !== attendeeToRemove.phone;
            })
          };
        }

        await updateEvent(eventId, updatedEvent);
        setEvent(updatedEvent);
        onRefresh();
        
        alert(`"${attendeeName}" has been removed from the event.`);
      } catch (error) {
        console.error('Remove attendee error:', error);
        alert('Failed to remove attendee. Please try again.');
      }
    }
  };

  const isUserAttending = () => {
    if (!event || !isAuthenticated()) return false;
    
    // If user has phone, check by phone
    if (user.phone) {
      return event.attendees.some(attendee => attendee.phone === user.phone);
    }
    
    // If user doesn't have phone (like admin), check by username or name
    if (user.username) {
      return event.attendees.some(attendee => 
        attendee.name === user.username || 
        attendee.name === user.name ||
        attendee.name === `${user.username} (Admin)`
      );
    }
    
    return false;
  };

  const getStatusBadge = (status) => {
    return <span className={`status-badge status-${status}`}>{status}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString();
  };

  const formatJoinTime = (joinTimeString) => {
    if (!joinTimeString) return 'Unknown';
    const joinTime = new Date(joinTimeString);
    const now = new Date(liveUpdateTime); // Use live update time for re-renders
    const diffInMinutes = Math.floor((now - joinTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    
    return joinTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <div style={{ marginTop: '1rem' }}>
          <button onClick={onBack} className="btn">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card">
        <h2>Event Not Found</h2>
        <p>The event you're looking for doesn't exist.</p>
        <button onClick={onBack} className="btn">Back to Events</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={onBack} className="btn">← Back to Events</button>
      </div>

      <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '1rem', color: '#2c3e50' }}>{String(event?.title || 'Event')}</h1>
            {getStatusBadge(event.status)}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Join/Leave Event Button */}
            {isAuthenticated() ? (
              isUserAttending() ? (
                <button 
                  className="btn btn-danger"
                  onClick={handleLeaveEvent}
                >
                  🚪 Leave Event
                </button>
              ) : (
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    // If admin doesn't have phone, show join form to collect info
                    if (!user.phone) {
                      setShowJoinForm(true);
                    } else {
                      handleJoinEvent({ preventDefault: () => {} });
                    }
                  }}
                  disabled={event.attendees.length >= Math.min(event.maxAttendees || 20, 20)}
                  title={event.attendees.length >= Math.min(event.maxAttendees || 20, 20) ? 'Event is full' : 'Join this event'}
                >
                  {event.attendees.length >= Math.min(event.maxAttendees || 20, 20) ? 'Event Full' : 'Join Event'}
                </button>
              )
            ) : (
              <button 
                className="btn btn-success"
                onClick={() => setShowJoinForm(true)}
                disabled={event.attendees.length >= Math.min(event.maxAttendees || 20, 20)}
                title={event.attendees.length >= Math.min(event.maxAttendees || 20, 20) ? 'Event is full' : 'Join this event'}
              >
                {event.attendees.length >= Math.min(event.maxAttendees || 20, 20) ? 'Event Full' : 'Join Event'}
              </button>
            )}

            {/* Admin Actions */}
            {canEdit() && (
              <button 
                onClick={() => {
                  console.log('✏️ Edit button clicked for event:', eventId);
                  console.log('✏️ Event object:', event);
                  console.log('✏️ onEdit callback:', onEdit);
                  console.log('✏️ onEdit type:', typeof onEdit);
                  if (onEdit) {
                    console.log('✏️ Calling onEdit()...');
                    onEdit();
                    console.log('✏️ onEdit() called successfully');
                  } else {
                    console.error('❌ onEdit callback is not defined');
                  }
                }} 
                className="btn"
              >
                ✏️ Edit
              </button>
            )}
            {canDelete() && (
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>

        {/* Guest Join Form */}
        {showJoinForm && (
          <div className="join-form" style={{ marginBottom: '2rem' }}>
            <h3>🎯 Join Event</h3>
            <form onSubmit={handleJoinEvent} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="guestName">Your Name *</label>
                  <input
                    type="text"
                    id="guestName"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="guestPhone">Phone Number *</label>
                  <input
                    type="tel"
                    id="guestPhone"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number (e.g., +1234567890)"
                  />
                  <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                    We use phone numbers to prevent duplicate registrations
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="guestTeam">Team *</label>
                <select
                  id="guestTeam"
                  value={guestInfo.team}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, team: e.target.value }))}
                >
                  <option value="">Select your team</option>
                  {availableTeams.map((team, index) => (
                    <option key={index} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={joinLoading}
                >
                  {joinLoading ? 'Joining...' : '✅ Confirm Join'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowJoinForm(false);
                    setGuestInfo({ name: '', team: '', phone: '' });
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <h3>📋 Event Details</h3>
            <div className="form-group">
              <label>Description:</label>
              <p style={{ marginTop: '0.5rem', lineHeight: 1.6 }}>
                {String(event?.description || 'No description provided')}
              </p>
            </div>

            <div className="form-group">
              <label>📅 Date & Time:</label>
              <p style={{ marginTop: '0.5rem' }}>
                <strong>{formatDate(event?.date || 'TBD')}</strong>
                <br />
                🕐 {String(event?.time || 'TBD')}
              </p>
            </div>

            <div className="form-group">
              <label>📍 Location:</label>
              <p style={{ marginTop: '0.5rem' }}>{String(event?.location || 'TBD')}</p>
            </div>

            <div className="form-group">
              <label>👥 Capacity:</label>
              <p style={{ marginTop: '0.5rem' }}>
                {(() => {
                  const maxAllowed = Math.min(event.maxAttendees || 20, 20);
                  const currentCount = event.attendees?.length || 0;
                  return (
                    <span>
                      <strong>{currentCount} / {maxAllowed}</strong> attendees
                      {maxAllowed - currentCount > 0 ? (
                        <span style={{ color: '#2e7d32', marginLeft: '0.5rem' }}>
                          ({maxAllowed - currentCount} spots remaining)
                        </span>
                      ) : (
                        <span style={{ color: '#d32f2f', marginLeft: '0.5rem' }}>
                          (Event is full)
                        </span>
                      )}
                    </span>
                  );
                })()}
              </p>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                👥 Live Attendees ({event.attendees ? event.attendees.length : 0}
                /{Math.min(event.maxAttendees || 20, 20)})
              </h3>
              <span style={{
                background: '#4caf50',
                color: 'white',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite'
              }}>
                🔴 LIVE
              </span>
              {isAutoSyncing && (
                <span style={{
                  background: '#2196f3',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  animation: 'pulse 1s infinite'
                }}>
                  🔄 SYNC
                </span>
              )}
              {event.attendees && Math.min(event.maxAttendees || 20, 20) && event.attendees.length >= Math.min(event.maxAttendees || 20, 20) && (
                <span style={{
                  background: '#ff5722',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  🚫 FULL
                </span>
              )}
            </div>
            
            {/* Quick Stats */}
            {event.attendees && event.attendees.length > 0 && (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>📊 Total: {event.attendees.length}/{Math.min(event.maxAttendees || 20, 20)}</span>
                  <span style={{ 
                    color: event.attendees.length >= Math.min(event.maxAttendees || 20, 20) ? '#d32f2f' : '#2e7d32',
                    fontWeight: 'bold'
                  }}>
                    🎯 {Math.min(event.maxAttendees || 20, 20) - event.attendees.length > 0 
                      ? `${Math.min(event.maxAttendees || 20, 20) - event.attendees.length} spots left`
                      : 'Event is full'
                    }
                  </span>
                  <span>🕐 Latest: {formatJoinTime(event.attendees.reduce((latest, attendee) => {
                    // Handle both string and object formats safely
                    if (typeof attendee === 'string' || !attendee.joinedAt) return latest;
                    return !latest || new Date(attendee.joinedAt) > new Date(latest) ? attendee.joinedAt : latest;
                  }, null))}</span>
                  <span>🏆 First: {(() => {
                    const firstAttendee = event.attendees.find(a => typeof a === 'object' && a.joinOrder === 1);
                    if (firstAttendee) return firstAttendee.name;
                    const firstAttendeeAny = event.attendees[0];
                    return typeof firstAttendeeAny === 'string' ? firstAttendeeAny : firstAttendeeAny?.name || 'Unknown';
                  })()}</span>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    📡 Last sync: {formatJoinTime(lastSyncTime)}
                  </span>
                </div>
              </div>
            )}
            {event.attendees && event.attendees.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {event.attendees.map((attendee, index) => (
                  <li key={index} className="attendee-card">
                    {typeof attendee === 'string' ? (
                      // Legacy format (string only)
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div className="attendee-name">
                            <span style={{ 
                              background: '#e3f2fd', 
                              color: '#1976d2', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '12px', 
                              fontSize: '0.8rem', 
                              fontWeight: 'bold', 
                              marginRight: '0.5rem' 
                            }}>
                              #{index + 1}
                            </span>
                            👤 {attendee}
                          </div>
                          <div className="attendee-detail" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                            🕐 Legacy registration (no timestamp)
                          </div>
                        </div>
                        {canEdit() && (
                          <button
                            onClick={() => handleRemoveAttendee(attendee)}
                            className="btn btn-danger"
                            style={{ 
                              fontSize: '0.8rem', 
                              padding: '0.3rem 0.6rem',
                              marginLeft: '1rem'
                            }}
                            title={`Remove ${attendee} from event`}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      // New format (object with details)
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div className="attendee-name">
                            <span style={{ 
                              background: '#e8f5e8', 
                              color: '#2e7d32', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '12px', 
                              fontSize: '0.8rem', 
                              fontWeight: 'bold', 
                              marginRight: '0.5rem' 
                            }}>
                              #{attendee.joinOrder || index + 1}
                            </span>
                            👤 {attendee.name || 'Unknown'}
                            {attendee.role === 'admin' && (
                              <span className="admin-badge">
                                👑 ADMIN
                              </span>
                            )}
                          </div>
                          <div className="attendee-detail">
                            🏢 <span>{attendee.team || 'No team'}</span>
                          </div>
                          <div className="attendee-detail">
                            📞 <span>{attendee.phone || 'No phone'}</span>
                          </div>
                          <div className="attendee-detail" style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '0.8rem', 
                            color: '#666',
                            fontStyle: 'italic' 
                          }}>
                            🕐 Joined {formatJoinTime(attendee.joinedAt || null)}
                          </div>
                        </div>
                        {canEdit() && (
                          <button
                            onClick={() => handleRemoveAttendee(attendee)}
                            className="btn btn-danger"
                            style={{ 
                              fontSize: '0.8rem', 
                              padding: '0.3rem 0.6rem',
                              marginLeft: '1rem',
                              marginTop: '0.2rem'
                            }}
                            title={`Remove ${attendee.name} from event`}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                No attendees registered yet - be the first to join! 🎯
              </p>
            )}

            <h3>ℹ️ Metadata</h3>
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
              <p><strong>Created:</strong> {formatDateTime(event.createdAt)}</p>
              <p><strong>Last Updated:</strong> {formatDateTime(event.updatedAt)}</p>
              <p><strong>Event ID:</strong> {event.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
