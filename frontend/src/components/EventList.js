import React from 'react';
import { Link } from 'react-router-dom';
import { deleteEvent } from '../services/eventService';
import { useUser } from '../contexts/UserContext';

const EventList = ({ events, loading, error, onRefresh }) => {
  const { canEdit, canDelete, isAuthenticated } = useUser();
  
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
        <button className="btn" onClick={onRefresh} style={{marginLeft: '1rem'}}>
          Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card">
        <h2>No Events Found</h2>
        <p>No events have been created yet.</p>
        <Link to="/create" className="btn">Create Your First Event</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>📅 All Events ({events.length})</h2>
        <div>
          <button className="btn" onClick={onRefresh}>
            🔄 Refresh
          </button>
          {!isAuthenticated() && (
            <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#666' }}>
              👤 You're browsing as a guest - you can view and join events
            </span>
          )}
        </div>
      </div>

      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <div className="event-title">{event.title}</div>
            
            <div className="event-meta">
              📅 {formatDate(event.date)} at {event.time}
              <br />
              📍 {event.location}
              <br />
              👥 {event.attendees ? event.attendees.length : 0} attendees
            </div>
            
            <div className="event-description">
              {event.description}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              {getStatusBadge(event.status)}
            </div>
            
            <div>
              <Link to={`/event/${event.id}`} className="btn">
                👁️ View
              </Link>
              {canEdit() && (
                <Link to={`/edit/${event.id}`} className="btn">
                  ✏️ Edit
                </Link>
              )}
              {canDelete() && (
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(event.id, event.title)}
                >
                  🗑️ Delete
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
