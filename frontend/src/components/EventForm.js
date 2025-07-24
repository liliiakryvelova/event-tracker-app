import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEvent, updateEvent, getEvent } from '../services/eventService';

const EventForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    attendees: [],
    status: 'planned',
    maxAttendees: null // Add attendee limit field
  });

  const [attendeeInput, setAttendeeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isEditing) {
      loadEvent();
    }
  }, [id, isEditing]);

  const loadEvent = async () => {
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
        maxAttendees: event.maxAttendees || null
      });
    } catch (error) {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

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
      if (isEditing) {
        await updateEvent(id, formData);
        setSuccess('Event updated successfully!');
      } else {
        await createEvent(formData);
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
      <h2>{isEditing ? '✏️ Edit Event' : '➕ Create New Event'}</h2>
      
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
          <input
            type="number"
            id="maxAttendees"
            name="maxAttendees"
            value={formData.maxAttendees || ''}
            onChange={handleChange}
            min="1"
            max="1000"
            placeholder="No limit (leave empty for unlimited)"
          />
          <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
            Set maximum number of attendees (optional). Leave empty for unlimited capacity.
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
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? '💾 Update Event' : '➕ Create Event')}
          </button>
          
          <button
            type="button"
            className="btn"
            onClick={handleCancel}
            disabled={loading}
          >
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
