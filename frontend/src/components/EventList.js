import React from 'react';
import { deleteEvent } from '../services/eventService';
import { useUser } from '../contexts/UserContext';

const EventList = ({ events, loading, error, onRefresh, onEditEvent, onViewEvent }) => {
  const { canEdit, canDelete, canCreate, isAuthenticated } = useUser();
  
  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteEvent(id);
        onRefresh();
      } catch (error) {
        alert('Failed to delete event');
      }
    }
  };

  const getStatusBadge = (status) => {
    return <span className={`status-badge status-${status}`}>{status}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card">
        <h2>No Events Found</h2>
        <p>No events have been created yet.</p>
        {!isAuthenticated() && (
          <p style={{ marginTop: '1rem', color: '#666', fontStyle: 'italic' }}>
            Please sign in to create events.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>All Events ({events.length}/3)</h2>
        <div>
          {!isAuthenticated() && (
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              You're browsing as a guest - you can view and join events
            </span>
          )}
          {events.length >= 3 && canCreate() && (
            <span style={{ fontSize: '0.9rem', color: '#e74c3c', fontWeight: 'bold' }}>
              ⚠️ Event limit reached (3/3)
            </span>
          )}
        </div>
      </div>

      <div 
        className="events-grid" 
        style={{
          display: 'grid',
          gridTemplateColumns: events.length === 1 
            ? '1fr' 
            : events.length === 2 
              ? 'repeat(2, 1fr)' 
              : 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
          justifyItems: events.length === 1 ? 'center' : 'stretch'
        }}
      >
        {events.map((event) => (
          <div 
            key={event.id} 
            className="event-card"
            style={{
              maxWidth: events.length === 1 ? '500px' : 'none',
              width: '100%'
            }}
          >
            <div className="event-title">{event.title}</div>
            
            <div className="event-meta">
              📅 {formatDate(event.date)} at {event.time}
              <br />
              📍 {event.location}
              <br />
              👥 {event.attendees ? event.attendees.length : 0}/{event.maxAttendees || 20} attendees
              {event.maxAttendees && event.attendees && event.attendees.length >= event.maxAttendees && (
                <span style={{ color: '#e74c3c', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  (FULL)
                </span>
              )}
            </div>
            
            <div className="event-description">
              {event.description}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              {getStatusBadge(event.status)}
            </div>
            
            <div>
              <button 
                onClick={() => onViewEvent && onViewEvent(event.id)} 
                className="btn"
              >
                View Details
              </button>
              {canEdit() && (
                <button 
                  onClick={() => onEditEvent && onEditEvent(event.id)} 
                  className="btn"
                >
                  Edit
                </button>
              )}
              {canDelete() && (
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(event.id, event.title)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventList;
