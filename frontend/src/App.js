import React, { useState, useEffect } from 'react';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import EventDetail from './components/EventDetail';
import Login from './components/Login';
import Header from './components/Header';
import Footer from './components/Footer';
import { UserProvider, useUser } from './contexts/UserContext';
import { getEvents } from './services/eventService';

const AppContent = () => {
  const { canCreate, loading } = useUser();
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
    console.log('🏠 Navigating to events list...');
    console.log('🏠 Previous activeView:', activeView);
    setActiveView('events');
    setEditingEventId(null);
    setViewingEventId(null);
    console.log('🏠 New activeView: events');
  };

  const showLogin = () => {
    console.log('🔐 Navigating to login...');
    setActiveView('login');
  };

  const showCreateEvent = () => {
    console.log('➕ Navigating to create event...');
    setActiveView('create');
  };

  const showEditEvent = (eventId) => {
    console.log('✏️ showEditEvent called with eventId:', eventId);
    console.log('✏️ Current activeView before edit:', activeView);
    console.log('✏️ Current editingEventId before edit:', editingEventId);
    setEditingEventId(eventId);
    setActiveView('edit');
    setViewingEventId(null); // Clear viewing when editing
    console.log('✏️ Set editingEventId to:', eventId);
    console.log('✏️ Set activeView to: edit');
  };

  const showEventDetail = (eventId) => {
    console.log('👁️ Navigating to event detail:', eventId);
    setViewingEventId(eventId);
    setActiveView('detail');
  };

  const handleFormSuccess = () => {
    console.log('✅ Form success - returning to events...');
    refreshEvents();
    showEvents(); // Return to events list after successful form submission
  };

  const handleLoginSuccess = () => {
    console.log('✅ Login success - returning to events...');
    showEvents(); // Return to events list after successful login
  };

  console.log('🎯 Current activeView:', activeView);
  console.log('🎯 Current editingEventId:', editingEventId);
  console.log('🎯 Current viewingEventId:', viewingEventId);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
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

      <div className="container" style={{ flex: '1', paddingBottom: '2rem' }}>
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
      
      <Footer />
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
