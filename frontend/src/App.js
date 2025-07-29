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
      const eventId = path.split('/edit/')[1];
      if (eventId && eventId.match(/^\d+$/)) {
        console.log('✏️ Initial route: edit event page for ID:', eventId);
        return 'edit';
      } else {
        console.log('⚠️ Invalid edit route, redirecting to events');
        window.history.replaceState({}, '', '/');
        return 'events';
      }
    } else if (path.startsWith('/event/')) {
      const eventId = path.split('/event/')[1];
      if (eventId && eventId.match(/^\d+$/)) {
        console.log('📋 Initial route: event detail page for ID:', eventId);
        return 'detail';
      } else {
        console.log('⚠️ Invalid event route, redirecting to events');
        window.history.replaceState({}, '', '/');
        return 'events';
      }
    }
    
    // For root URL or any other unknown routes, show events
    if (path !== '/') {
      console.log('⚠️ Unknown route:', path, '- redirecting to events');
      window.history.replaceState({}, '', '/');
    }
    
    console.log('🏠 Default route: events list');
    return 'events';
  };

  // Get initial event IDs from URL
  const getInitialEventIds = () => {
    const path = window.location.pathname;
    const editMatch = path.match(/^\/edit\/(.+)$/);
    const eventMatch = path.match(/^\/event\/(.+)$/);
    
    return {
      editingEventId: editMatch && editMatch[1].match(/^\d+$/) ? editMatch[1] : null,
      viewingEventId: eventMatch && eventMatch[1].match(/^\d+$/) ? eventMatch[1] : null
    };
  };

  const initialEventIds = getInitialEventIds();

  // State for UI navigation
  const [activeView, setActiveView] = useState(getInitialView);
  const [editingEventId, setEditingEventId] = useState(initialEventIds.editingEventId);
  const [viewingEventId, setViewingEventId] = useState(initialEventIds.viewingEventId);

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
      console.log('⬅️ Current path:', path);
      
      if (path === '/login') {
        console.log('⬅️ Navigating to login via popstate');
        setActiveView('login');
        setEditingEventId(null);
        setViewingEventId(null);
      } else if (path === '/create') {
        console.log('⬅️ Navigating to create via popstate');
        setActiveView('create');
        setEditingEventId(null);
        setViewingEventId(null);
      } else if (path.startsWith('/edit/')) {
        const eventId = path.split('/edit/')[1];
        if (eventId && eventId.match(/^\d+$/)) {
          console.log('⬅️ Navigating to edit event via popstate:', eventId);
          setActiveView('edit');
          setEditingEventId(eventId);
          setViewingEventId(null);
        } else {
          console.log('⚠️ Invalid edit event ID in popstate, redirecting to events');
          window.history.replaceState({}, '', '/');
          setActiveView('events');
          setEditingEventId(null);
          setViewingEventId(null);
        }
      } else if (path.startsWith('/event/')) {
        const eventId = path.split('/event/')[1];
        if (eventId && eventId.match(/^\d+$/)) {
          console.log('⬅️ Navigating to event detail via popstate:', eventId);
          setActiveView('detail');
          setViewingEventId(eventId);
          setEditingEventId(null);
        } else {
          console.log('⚠️ Invalid event ID in popstate, redirecting to events');
          window.history.replaceState({}, '', '/');
          setActiveView('events');
          setEditingEventId(null);
          setViewingEventId(null);
        }
      } else {
        // For root URL or any unknown routes, go to events
        console.log('⬅️ Navigating to events via popstate (root or unknown route)');
        if (path !== '/') {
          console.log('⚠️ Unknown route in popstate:', path, '- redirecting to root');
          window.history.replaceState({}, '', '/');
        }
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
        {activeView === 'detail' && (
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
