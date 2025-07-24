import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEvent, updateEvent, getEvent, getEvents } from '../services/eventService';
import { useUser } from '../contexts/UserContext';

const EventForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canCreate } = useUser();
  const isEditing = !!id;

  // All useState hooks must come before any conditional returns
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    attendees: [],
    status: 'planned',
    maxAttendees: 20 // Default to 20 attendees max
  });

  const [attendeeInput, setAttendeeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [eventCount, setEventCount] = useState(0);

  // All useEffect hooks must come before any conditional returns
  // Redirect if user cannot create events
  useEffect(() => {
    if (!canCreate()) {
      navigate('/login');
    }
  }, [canCreate, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (isEditing) {
        try {
          setLoading(true);
          const event = await getEvent(id);
          setFormData({
            title: event.title || '',
            description: event.description || '',
            date: event.date || '',
            time: event.time || '',
            location: event.location || '',
            attendees: event.attendees || [],
            status: event.status || 'planned',
            maxAttendees: event.maxAttendees || 20
          });
        } catch (error) {
          setError('Failed to load event');
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const events = await getEvents();
          setEventCount(events.length);
        } catch (error) {
          console.error('Failed to check event count:', error);
        }
      }
    };
    loadData();
  }, [id, isEditing]);

  // Show loading while checking authentication (after all hooks)
  if (!canCreate()) {
    return <div className="loading">Checking permissions...</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !formData.attendees.includes(attendeeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, attendeeInput.trim()]
      }));
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (attendeeToRemove) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(attendee => attendee !== attendeeToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check event limit for new events
      if (!isEditing && eventCount >= 3) {
        setError('Cannot create more events. Maximum of 3 events allowed.');
        setLoading(false);
        return;
      }

      // Validate max attendees
      if (formData.maxAttendees && formData.maxAttendees > 20) {
        setError('Maximum attendees cannot exceed 20 people.');
        setLoading(false);
        return;
      }

      // Ensure maxAttendees is set to 20 if not specified
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees || 20
      };

      if (isEditing) {
        await updateEvent(id, eventData);
        setSuccess('Event updated successfully!');
      } else {
        await createEvent(eventData);
        setSuccess('Event created successfully!');
      }
      
      onSuccess();
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setError(isEditing ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading && isEditing) {
    return <div className="loading">Loading event...</div>;
  }

  return (
    <div className="card">
      <h2>{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
      
      {!isEditing && eventCount >= 3 && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          ⚠️ Event limit reached! You cannot create more than 3 events. Please delete an existing event first.
        </div>
      )}
      
      {!isEditing && eventCount < 3 && (
        <div style={{ 
          background: '#e8f5e8', 
          color: '#2e7d32', 
          padding: '0.75rem', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          📊 Events: {eventCount}/3 | 👥 Each event limited to maximum 20 attendees
        </div>
      )}
      
      {!isEditing && (
        <div style={{ 
          background: '#fff3e0', 
          color: '#f57c00', 
          padding: '0.75rem', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.9rem',
          border: '1px solid #ffb74d'
        }}>
          ⚠️ <strong>Important:</strong> All events are automatically limited to a maximum of 20 attendees for optimal game experience.
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Event Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter event title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter event description"
            rows={4}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="Enter event location"
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxAttendees">👥 Attendee Limit</label>
          <div style={{ 
            background: '#f3e5f5', 
            color: '#7b1fa2', 
            padding: '0.5rem', 
            borderRadius: '4px', 
            marginBottom: '0.5rem',
            fontSize: '0.85rem',
            border: '1px solid #ce93d8'
          }}>
            🚫 <strong>Maximum limit: 20 attendees per event</strong> - This cannot be exceeded
          </div>
          <input
            type="number"
            id="maxAttendees"
            name="maxAttendees"
            value={formData.maxAttendees || ''}
            onChange={handleChange}
            min="1"
            max="20"
            placeholder="Enter limit (1-20, default: 20)"
          />
          <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
            Set maximum number of attendees (1-20). Will default to 20 if left empty.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="planned">Planned</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="form-group">
          <label>Attendees</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              placeholder="Enter attendee name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAttendee();
                }
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={handleAddAttendee}
            >
              Add
            </button>
          </div>
          
          {formData.attendees.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              {formData.attendees.map((attendee, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '0.25rem 0.5rem',
                    margin: '0.25rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem'
                  }}
                >
                  {attendee}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(attendee)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1976d2',
                      marginLeft: '0.5rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="submit"
            className="btn btn-success"
            disabled={loading || (!isEditing && eventCount >= 3)}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Event' : eventCount >= 3 ? 'Event Limit Reached' : 'Create Event')}
          </button>
          
          <button
            type="button"
            className="btn"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
