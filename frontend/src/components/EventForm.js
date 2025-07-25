import React, { useState, useEffect } from 'react';
import { createEvent, updateEvent, getEvent, getEvents } from '../services/eventService';
import { useUser } from '../contexts/UserContext';

// Helper function to properly handle Pacific Time dates
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  // Handle both ISO datetime and date-only formats
  if (dateString.includes('T')) {
    // Full ISO datetime from database - extract date part to avoid timezone shift
    return dateString.split('T')[0]; // Return YYYY-MM-DD part directly
  } else {
    // Date-only string - return as is
    return dateString;
  }
};

const EventForm = ({ eventId, onSuccess, onCancel }) => {
  const { canCreate, canEdit } = useUser();
  const isEditing = !!eventId;

  console.log('📝 EventForm rendered with props:');
  console.log('📝 eventId:', eventId);
  console.log('📝 isEditing:', isEditing);
  console.log('📝 onSuccess:', onSuccess);
  console.log('📝 onCancel:', onCancel);

  // All useState hooks must come before any conditional returns
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    status: 'planned'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [eventCount, setEventCount] = useState(0);

  // All useEffect hooks must come before any conditional returns
  // Handle authentication check
  useEffect(() => {
    const hasPermission = isEditing ? canEdit() : canCreate();
    console.log('📝 EventForm permission check:');
    console.log('📝 isEditing:', isEditing);
    console.log('📝 canCreate():', canCreate());
    console.log('📝 canEdit():', canEdit());
    console.log('📝 hasPermission:', hasPermission);
    
    if (!hasPermission && onCancel) {
      console.log('📝 No permission, calling onCancel');
      onCancel(); // Return to events list if not authenticated
    }
  }, [canCreate, canEdit, isEditing, onCancel]);

  useEffect(() => {
    const loadData = async () => {
      console.log('📝 EventForm: Loading data...');
      console.log('📝 EventForm: eventId:', eventId);
      console.log('📝 EventForm: isEditing:', isEditing);
      
      if (isEditing && eventId) {
        try {
          setLoading(true);
          console.log('📝 EventForm: Fetching event for editing...');
          const event = await getEvent(eventId);
          console.log('📝 EventForm: Loaded event data:', event);
          
          setFormData({
            title: String(event.title || ''),
            description: String(event.description || ''),
            date: formatDateForInput(event.date),
            time: String(event.time || ''),
            location: String(event.location || ''),
            status: String(event.status || 'planned')
          });
          console.log('📝 EventForm: Form data set successfully');
        } catch (error) {
          console.error('📝 EventForm: Failed to load event:', error);
          setError('Failed to load event');
        } finally {
          setLoading(false);
        }
      } else if (!isEditing) {
        try {
          console.log('📝 EventForm: Fetching events for count...');
          const events = await getEvents();
          console.log('📝 EventForm: Fetched events:', events, 'count:', events.length);
          setEventCount(events.length);
        } catch (error) {
          console.error('❌ Failed to check event count:', error);
          console.error('❌ Error details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
          // Don't block the form if event count fails
          setEventCount(0);
        }
      }
    };
    loadData();
  }, [eventId, isEditing]);

  // Show loading while checking authentication (after all hooks)
  const hasPermission = isEditing ? canEdit() : canCreate();
  if (!hasPermission) {
    return (
      <div className="loading">
        {isEditing ? 'Checking edit permissions...' : 'Checking create permissions...'}
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

      // Prepare event data for submission
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: formData.status
      };

      console.log('📝 EventForm: Submitting event data:', eventData);
      console.log('📝 EventForm: Is editing:', isEditing);
      console.log('📝 EventForm: Event ID:', eventId);

      if (isEditing) {
        console.log('🔄 Calling updateEvent with:', eventId, eventData);
        await updateEvent(eventId, eventData);
        setSuccess('Event updated successfully!');
        console.log('✅ Event updated successfully');
      } else {
        console.log('➕ Calling createEvent with:', eventData);
        await createEvent(eventData);
        setSuccess('Event created successfully!');
        console.log('✅ Event created successfully');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        if (onCancel) {
          onCancel(); // Return to events list
        }
      }, 1500);
    } catch (error) {
      setError(isEditing ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(); // Return to events list
    }
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
          📊 Events: {eventCount}/3
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
