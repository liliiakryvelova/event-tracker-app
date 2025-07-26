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
  
  // Get initial view based on URL
  const getInitialView = () => {
    const path = window.location.pathname;
    console.log('🚦 Checking initial URL path:', path);
    
    if (path === '/login') {
      console.log('🔐 Initial route: login page');
      return 'login';
    } else if (path === '/create') {
      console.log('➕ Initial route: create event page');
      return 'create';
    } else if (path.startsWith('/edit/')) {
      console.log('✏️ Initial route: edit event page');
      return 'edit';
    } else if (path.startsWith('/event/')) {
      console.log('📋 Initial route: event detail page');
      return 'detail';
    }
    
    console.log('🏠 Initial route: events list (default)');
    return 'events';
  };    // State for UI navigation
  const [activeView, setActiveView] = useState(() => {
    const path = window.location.pathname;
    console.log('🚦 Initializing with URL path:', path);
    
    // Extract event ID from URL if present
    const editMatch = path.match(/^\/edit\/(.+)$/);
    const eventMatch = path.match(/^\/event\/(.+)$/);
    
    if (editMatch) {
      const eventId = editMatch[1];
      console.log('✏️ Found edit route with ID:', eventId);
      setTimeout(() => setEditingEventId(eventId), 0); // Set after component mounts
      return 'edit';
    }
    
    if (eventMatch) {
      const eventId = eventMatch[1];
      console.log('📋 Found event detail route with ID:', eventId);
      setTimeout(() => setViewingEventId(eventId), 0); // Set after component mounts
      return 'detail';
    }
    
    return getInitialView();
  });
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

    // Handle browser back/forward buttons
    const handlePopState = () => {
      console.log('⬅️ Browser navigation detected, updating view...');
      const path = window.location.pathname;
      
      if (path === '/login') {
        setActiveView('login');
      } else if (path === '/create') {
        setActiveView('create');
      } else if (path.startsWith('/edit/')) {
        const eventId = path.split('/edit/')[1];
        setActiveView('edit');
        setEditingEventId(eventId);
        setViewingEventId(null);
      } else if (path.startsWith('/event/')) {
        const eventId = path.split('/event/')[1];
        setActiveView('detail');
        setViewingEventId(eventId);
        setEditingEventId(null);
      } else {
        setActiveView('events');
        setEditingEventId(null);
        setViewingEventId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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
    // Update URL without page reload
    window.history.pushState({}, '', '/');
    console.log('🏠 New activeView: events');
  };

  const showLogin = () => {
    console.log('🔐 Navigating to login...');
    setActiveView('login');
    // Update URL without page reload
    window.history.pushState({}, '', '/login');
  };

  const showCreateEvent = () => {
    console.log('➕ Navigating to create event...');
    setActiveView('create');
    // Update URL without page reload
    window.history.pushState({}, '', '/create');
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
    // Update URL without page reload
    window.history.pushState({}, '', `/edit/${eventId}`);
  };

  const showEventDetail = (eventId) => {
    console.log('👁️ Navigating to event detail:', eventId);
    setViewingEventId(eventId);
    setActiveView('detail');
    // Update URL without page reload
    window.history.pushState({}, '', `/event/${eventId}`);
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
          <Login 
            onSuccess={handleLoginSuccess}
            onBack={showEvents}
          />
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
