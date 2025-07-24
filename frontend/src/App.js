import React, { useState, useEffect } from 'react';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import EventDetail from './components/EventDetail';
import Login from './components/Login';
import Header from './components/Header';
import { UserProvider, useUser } from './contexts/UserContext';
import { getEvents } from './services/eventService';

const AppContent = () => {
  const { canCreate, loading, isAuthenticated } = useUser();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for controlling what section is visible
  const [activeView, setActiveView] = useState('events'); // 'events', 'login', 'create', 'edit', 'detail'
  const [editingEventId, setEditingEventId] = useState(null);
  const [viewingEventId, setViewingEventId] = useState(null);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const data = await getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch events, regardless of authentication status
    fetchEvents();
  }, []);

  const refreshEvents = () => {
    fetchEvents();
  };

  // Navigation handlers
  const showEvents = () => {
    setActiveView('events');
    setEditingEventId(null);
    setViewingEventId(null);
  };

  const showLogin = () => {
    setActiveView('login');
  };

  const showCreateEvent = () => {
    setActiveView('create');
  };

  const showEditEvent = (eventId) => {
    setEditingEventId(eventId);
    setActiveView('edit');
  };

  const showEventDetail = (eventId) => {
    setViewingEventId(eventId);
    setActiveView('detail');
  };

  const handleFormSuccess = () => {
    refreshEvents();
    showEvents(); // Return to events list after successful form submission
  };

  const handleLoginSuccess = () => {
    showEvents(); // Return to events list after successful login
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Header onShowLogin={showLogin} />

      <nav className="nav">
        <div className="container">
          <ul>
            <li>
              <button 
                onClick={showEvents}
                className={`nav-button ${activeView === 'events' ? 'active' : ''}`}
              >
                <span>🏐 All Events</span>
              </button>
            </li>
            {!isAuthenticated() && (
              <li>
                <button 
                  onClick={showLogin}
                  className={`nav-button ${activeView === 'login' ? 'active' : ''}`}
                >
                  <span>👤 Admin Login</span>
                </button>
              </li>
            )}
            {canCreate() && (
              <li>
                <button 
                  onClick={showCreateEvent}
                  className={`nav-button ${activeView === 'create' ? 'active' : ''}`}
                >
                  <span>⚡ Create Event</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <div className="container">
        {/* Events List Section */}
        {activeView === 'events' && (
          <EventList 
            events={events} 
            loading={eventsLoading} 
            error={error}
            onRefresh={refreshEvents}
            onEditEvent={showEditEvent}
            onViewEvent={showEventDetail}
          />
        )}

        {/* Login Section */}
        {activeView === 'login' && (
          <Login onSuccess={handleLoginSuccess} />
        )}

        {/* Create Event Section */}
        {activeView === 'create' && (
          <EventForm 
            onSuccess={handleFormSuccess}
            onCancel={showEvents}
          />
        )}

        {/* Edit Event Section */}
        {activeView === 'edit' && editingEventId && (
          <EventForm 
            eventId={editingEventId}
            onSuccess={handleFormSuccess}
            onCancel={showEvents}
          />
        )}

        {/* Event Detail Section */}
        {activeView === 'detail' && viewingEventId && (
          <EventDetail 
            eventId={viewingEventId}
            onRefresh={refreshEvents}
            onEdit={() => showEditEvent(viewingEventId)}
            onBack={showEvents}
          />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
