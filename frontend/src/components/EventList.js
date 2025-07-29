import React, { useCallback } from 'react';
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

    // Calculate event status based on date and time
  const getEventStatus = useCallback((event) => {
    try {
      if (!event?.date || !event?.time) {
        console.warn('Missing date or time for event:', event);
        return 'scheduled';
      }
      
      // Handle both ISO datetime and date-only formats
      let datePart;
      if (event.date.includes('T')) {
        // Full ISO datetime from database - extract date part
        datePart = event.date.split('T')[0];
      } else {
        // Date-only string
        datePart = event.date;
      }
      
      // Validate date part format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        console.warn('Invalid date format for event:', event);
        return 'scheduled';
      }
      
      const eventTime = event.time;
      
      // Parse time safely
      if (!eventTime || typeof eventTime !== 'string') {
        console.warn('Invalid time for event:', event);
        return 'scheduled';
      }
      
      const timeParts = eventTime.split(':');
      if (timeParts.length !== 2) {
        console.warn('Invalid time format for event:', event);
        return 'scheduled';
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Validate time parts
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time values for event:', event);
        return 'scheduled';
      }
      
      // Create event datetime as local date to avoid timezone issues
      const [year, month, day] = datePart.split('-');
      const eventDateTime = new Date(year, month - 1, day, hours, minutes, 0);
      
      // Check if the combined datetime is valid
      if (isNaN(eventDateTime.getTime())) {
        console.warn('Invalid datetime combination for event:', event);
        return 'scheduled';
      }
      
      const now = new Date();
      const eventEndTime = new Date(eventDateTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
      
      if (now >= eventDateTime && now <= eventEndTime) {
        return 'happening';
      } else if (now > eventEndTime) {
        return 'finished';
      } else {
        return 'scheduled';
      }
    } catch (error) {
      console.error('Error calculating event status:', error, event);
      return 'scheduled'; // Safe fallback
    }
  }, []);

  const getStatusBadge = (event) => {
    const status = getEventStatus(event);
    
    const statusConfig = {
      scheduled: {
        text: '📅 Scheduled',
        className: 'status-scheduled',
        style: { backgroundColor: '#e3f2fd', color: '#1976d2', border: '1px solid #bbdefb' }
      },
      happening: {
        text: '🔴 LIVE NOW',
        className: 'status-happening',
        style: { 
          backgroundColor: '#ffebee', 
          color: '#d32f2f', 
          border: '1px solid #ffcdd2',
          animation: 'pulse 2s infinite'
        }
      },
      finished: {
        text: '✅ Finished',
        className: 'status-finished',
        style: { backgroundColor: '#f3e5f5', color: '#7b1fa2', border: '1px solid #e1bee7' }
      }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <span 
        className={`status-badge ${config.className}`}
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'inline-block',
          ...config.style
        }}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    
    // Handle both ISO datetime and date-only formats to avoid timezone shifts
    let datePart;
    if (dateString.includes('T')) {
      // Full ISO datetime from database - extract date part
      datePart = dateString.split('T')[0];
    } else {
      // Date-only string
      datePart = dateString;
    }
    
    // Parse as local date to avoid timezone conversion
    const [year, month, day] = datePart.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Sort events by date (closest first)
  const sortEventsByDate = (events) => {
    return [...events].sort((a, b) => {
      // Parse event dates and times
      const getEventDateTime = (event) => {
        if (!event?.date || !event?.time) {
          return new Date('9999-12-31'); // Put events without date/time at the end
        }
        
        // Handle both ISO datetime and date-only formats
        let datePart;
        if (event.date.includes('T')) {
          datePart = event.date.split('T')[0];
        } else {
          datePart = event.date;
        }
        
        // Combine date and time
        const dateTimeString = `${datePart}T${event.time}`;
        const eventDateTime = new Date(dateTimeString);
        
        // If invalid date, put at the end
        return isNaN(eventDateTime.getTime()) ? new Date('9999-12-31') : eventDateTime;
      };
      
      const dateA = getEventDateTime(a);
      const dateB = getEventDateTime(b);
      
      // Sort by date/time (earliest first)
      return dateA - dateB;
    });
  };

  // Get sorted events
  const sortedEvents = sortEventsByDate(events);

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
        <h2>All Events ({sortedEvents.length}/3)</h2>
        <div>
          {!isAuthenticated() && (
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              You're browsing as a guest - you can view and join events
            </span>
          )}
          {sortedEvents.length >= 3 && canCreate() && (
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
          gridTemplateColumns: sortedEvents.length === 1 
            ? '1fr' 
            : sortedEvents.length === 2 
              ? 'repeat(2, 1fr)' 
              : 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
          justifyItems: sortedEvents.length === 1 ? 'center' : 'stretch'
        }}
      >
        {sortedEvents.map((event) => (
          <div 
            key={event.id} 
            className="event-card"
            style={{
              maxWidth: sortedEvents.length === 1 ? '500px' : 'none',
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
              {getStatusBadge(event)}
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
