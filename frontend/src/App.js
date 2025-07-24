import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import EventDetail from './components/EventDetail';
import Login from './components/Login';
import Header from './components/Header';
import { UserProvider, useUser } from './contexts/UserContext';
import { getEvents } from './services/eventService';

const AppContent = () => {
  const { isAuthenticated, canCreate, loading } = useUser();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header />

        <nav className="nav">
          <div className="container">
            <ul>
              <li>
                <Link to="/"><span>🏐 All Events</span></Link>
              </li>
              {canCreate() && (
                <li>
                  <Link to="/create"><span>⚡ Create Event</span></Link>
                </li>
              )}
              {!isAuthenticated() && (
                <li>
                  <Link to="/login"><span>� Admin Login</span></Link>
                </li>
              )}
            </ul>
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                <EventList 
                  events={events} 
                  loading={eventsLoading} 
                  error={error}
                  onRefresh={refreshEvents}
                />
              } 
            />
            <Route 
              path="/login" 
              element={<Login />} 
            />
            {canCreate() && (
              <>
                <Route 
                  path="/create" 
                  element={
                    <EventForm 
                      onSuccess={refreshEvents}
                    />
                  } 
                />
                <Route 
                  path="/edit/:id" 
                  element={
                    <EventForm 
                      onSuccess={refreshEvents}
                    />
                  } 
                />
              </>
            )}
            <Route 
              path="/event/:id" 
              element={
                <EventDetail 
                  onRefresh={refreshEvents}
                />
              } 
            />
            {/* Catch-all route: redirect any invalid URL to home */}
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
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
