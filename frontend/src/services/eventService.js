import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://event-tracker-backend.onrender.com/api'
  : 'http://localhost:8000/api';

console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('🔧 Final API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Event service functions
export const getEvents = async () => {
  try {
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log('🚀 Fetching events from:', `${API_BASE_URL}/events`);
    const response = await api.get('/events');
    console.log('✅ Events response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
};

export const getEvent = async (id) => {
  try {
    console.log('🔍 Fetching event:', id, 'from:', `${API_BASE_URL}/events/${id}`);
    const response = await api.get(`/events/${id}`);
    console.log('✅ Event response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    console.log('🔄 updateEvent called with:', { id, eventData });
    const response = await api.put(`/events/${id}`, eventData);
    console.log('✅ updateEvent response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating event:', error);
    console.error('❌ Update error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const addAttendee = async (eventId, attendeeData) => {
  try {
    console.log('👤 Adding attendee to event:', eventId, attendeeData);
    const response = await api.post(`/events/${eventId}/attendees`, attendeeData);
    console.log('✅ Attendee added, updated event:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error adding attendee:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
};

export const removeAttendee = async (eventId, attendeeName) => {
  try {
    console.log('🗑️ Removing attendee from event:', eventId, attendeeName);
    const encodedName = encodeURIComponent(attendeeName);
    const response = await api.delete(`/events/${eventId}/attendees/${encodedName}`);
    console.log('✅ Attendee removed, updated event:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error removing attendee:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

export default api;
