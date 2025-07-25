const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase, dbQueries, pool, authenticateUser, changePassword } = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;

// Security headers middleware
app.use((req, res, next) => {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  
  // Security headers to improve browser trust
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline'; connect-src 'self' https:; img-src 'self' data: https:;");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// CORS configuration for separate SPA deployment
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://event-tracker-frontend-qv6e.onrender.com',
      'https://event-tracker-app-u25w.onrender.com', // Old backend URL (keeping for compatibility)
      'https://event-tracker-backend.onrender.com', // Current backend URL
      'http://localhost:3000', // For local development
      'http://localhost:3001' // Alternative local port
    ];
    
    // Allow any Render domain for this app during development
    if (origin.includes('onrender.com') && origin.includes('event-tracker')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Backend only serves API - frontend is deployed as separate static site

// Validation function for event data
const validateEventData = (eventData) => {
  const errors = [];
  
  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.push('Event title is required');
  }
  
  if (!eventData.date) {
    errors.push('Event date is required');
  }
  
  if (!eventData.time) {
    errors.push('Event time is required');
  }
  
  if (!eventData.location || eventData.location.trim().length === 0) {
    errors.push('Event location is required');
  }
  
  if (eventData.maxAttendees && (eventData.maxAttendees < 1 || eventData.maxAttendees > 1000)) {
    errors.push('Max attendees must be between 1 and 1000');
  }
  
  return errors;
};

// Routes

// API information route (moved to /api/)
app.get('/api/', (req, res) => {
  res.json({
    name: 'Event Tracker API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/events': 'Get all events',
      'GET /api/events/:id': 'Get single event by ID',
      'POST /api/events': 'Create new event',
      'PUT /api/events/:id': 'Update event (preserves attendees)',
      'DELETE /api/events/:id': 'Delete event',
      'POST /api/events/:id/attendees': 'Add attendee to event',
      'DELETE /api/events/:id/attendees/:name': 'Remove attendee from event',
      'POST /api/auth/login': 'Admin login',
      'POST /api/auth/change-password': 'Change admin password',
      'GET /api/health': 'Health check',
      'GET /api/status': 'Database status'
    },
    frontend: 'https://event-tracker-frontend-qv6e.onrender.com',
    backend: 'https://event-tracker-backend.onrender.com',
    documentation: 'Visit the endpoints above to interact with the API',
    note: 'SPA deployment - frontend and backend are separate services'
  });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    const result = await authenticateUser(username, password);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Login successful',
        user: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    const result = await changePassword(userId, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    console.log('📅 Fetching all events...');
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        date,
        time,
        location,
        max_attendees,
        status,
        created_at,
        updated_at
      FROM events 
      ORDER BY date ASC, time ASC
    `);
    
    const events = result.rows.map(event => ({
      ...event,
      attendees: []
    }));
    
    console.log(`📅 Found ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Debug endpoint to check event data
app.get('/api/debug/events', async (req, res) => {
  try {
    console.log('🔍 Debug: Fetching all events with detailed info...');
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        date,
        time,
        location,
        max_attendees,
        status,
        created_at,
        updated_at
      FROM events 
      ORDER BY date ASC, time ASC
    `);
    
    const events = result.rows.map(event => ({
      ...event,
      date_string: event.date ? event.date.toISOString().split('T')[0] : 'null',
      date_type: typeof event.date,
      time_type: typeof event.time,
      is_valid_date: event.date ? !isNaN(new Date(event.date).getTime()) : false
    }));
    
    console.log('🔍 Debug events data:', events);
    
    res.json({
      success: true,
      events: events,
      total: events.length,
      debug_info: {
        current_time: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  } catch (error) {
    console.error('❌ Debug events error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get single event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await dbQueries.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event
app.post('/api/events', async (req, res) => {
  try {
    // Validate input data
    const validationErrors = validateEventData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const newEvent = await dbQueries.createEvent(req.body);
    console.log(`Created new event: ${newEvent.title} (ID: ${newEvent.id})`);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    console.log('🔄 PUT /api/events/:id - Update event request');
    console.log('📝 Event ID:', req.params.id);
    console.log('📝 Request body:', req.body);
    console.log('📝 MaxAttendees from request:', req.body.maxAttendees);
    console.log('📝 Date from request:', req.body.date);
    
    const updatedEvent = await dbQueries.updateEvent(req.params.id, req.body);
    
    if (updatedEvent) {
      console.log(`✅ Updated event: ${updatedEvent.title} (ID: ${updatedEvent.id})`);
      console.log(`📊 Max Attendees: ${updatedEvent.max_attendees}`);
      console.log(`📅 Date: ${updatedEvent.date}`);
      console.log(`👥 Current Attendees: ${updatedEvent.attendees?.length || 0}`);
      res.json(updatedEvent);
    } else {
      console.log('❌ Event not found for ID:', req.params.id);
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const success = await dbQueries.deleteEvent(req.params.id);
    
    if (success) {
      res.json({ message: 'Event deleted successfully' });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Add attendee to event
app.post('/api/events/:id/attendees', async (req, res) => {
  try {
    console.log('👤 POST /api/events/:id/attendees - Add attendee request');
    console.log('📝 Event ID:', req.params.id);
    console.log('📝 Attendee data:', req.body);
    
    const result = await dbQueries.addAttendee(req.params.id, req.body);
    
    if (result.success) {
      console.log('✅ Attendee added successfully');
      // Return updated event with all attendees
      const updatedEvent = await dbQueries.getEventById(req.params.id);
      res.json(updatedEvent);
    } else {
      console.log('❌ Failed to add attendee:', result.message);
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('❌ Error adding attendee:', error);
    res.status(500).json({ error: 'Failed to add attendee' });
  }
});

// Remove attendee from event
app.delete('/api/events/:id/attendees/:name', async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/events/:id/attendees/:name - Remove attendee request');
    console.log('📝 Event ID:', req.params.id);
    console.log('📝 Attendee name:', req.params.name);
    
    const result = await dbQueries.removeAttendee(req.params.id, decodeURIComponent(req.params.name));
    
    if (result.success) {
      console.log('✅ Attendee removed successfully');
      // Return updated event with remaining attendees
      const updatedEvent = await dbQueries.getEventById(req.params.id);
      res.json(updatedEvent);
    } else {
      console.log('❌ Failed to remove attendee:', result.message);
      res.status(404).json({ error: result.message });
    }
  } catch (error) {
    console.error('❌ Error removing attendee:', error);
    res.status(500).json({ error: 'Failed to remove attendee' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug route to check frontend build status
app.get('/api/debug/frontend', (req, res) => {
  res.json({
    message: 'SPA deployment - frontend and backend are separate services',
    frontendUrl: 'https://event-tracker-frontend-qv6e.onrender.com',
    backendUrl: 'https://event-tracker-backend.onrender.com',
    deploymentType: 'Static frontend + API backend',
    note: 'Frontend is deployed as static site, backend serves API only',
    timestamp: new Date().toISOString()
  });
});

// Debug route to check what routes are being hit
app.get('/api/debug/requests', (req, res) => {
  res.json({
    message: 'Debug endpoint working',
    headers: req.headers,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Debug route to check user authentication status
app.get('/api/debug/users', async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const adminUsers = await pool.query('SELECT username, role, full_name, created_at FROM users WHERE role = $1', ['admin']);
    
    res.json({
      message: 'User debug information',
      totalUsers: parseInt(usersCount.rows[0].count),
      adminUsers: adminUsers.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check users',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
  try {
    // Get total counts from database
    const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
    const attendeesCount = await pool.query('SELECT COUNT(*) FROM attendees');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    
    res.json({
      status: 'OK',
      database: 'PostgreSQL',
      totalEvents: parseInt(eventsCount.rows[0].count),
      totalAttendees: parseInt(attendeesCount.rows[0].count),
      totalUsers: parseInt(usersCount.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database integrity check endpoint
app.get('/api/db-integrity', async (req, res) => {
  try {
    // Check for orphaned attendees (attendees without valid event_id)
    const orphanedAttendeesResult = await pool.query(`
      SELECT a.id, a.name, a.event_id 
      FROM attendees a 
      LEFT JOIN events e ON a.event_id = e.id 
      WHERE e.id IS NULL
    `);
    
    // Get total counts
    const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
    const attendeesCount = await pool.query('SELECT COUNT(*) FROM attendees');
    
    // Get events with their attendee counts
    const eventsWithCounts = await pool.query(`
      SELECT e.id, e.title, COUNT(a.id) as attendee_count
      FROM events e
      LEFT JOIN attendees a ON e.id = a.event_id
      GROUP BY e.id, e.title
      ORDER BY e.id
    `);
    
    res.json({
      status: 'OK',
      integrity: {
        totalEvents: parseInt(eventsCount.rows[0].count),
        totalAttendees: parseInt(attendeesCount.rows[0].count),
        orphanedAttendees: orphanedAttendeesResult.rows.length,
        orphanedDetails: orphanedAttendeesResult.rows,
        eventsWithCounts: eventsWithCounts.rows
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking database integrity:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API-only server - all routes should be under /api/
// Frontend routing is handled by the static site deployment
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    availableEndpoints: [
      'GET /api/',
      'GET /api/events',
      'GET /api/events/:id',
      'POST /api/events',
      'PUT /api/events/:id',
      'DELETE /api/events/:id',
      'POST /api/auth/login',
      'POST /api/auth/change-password',
      'GET /api/health',
      'GET /api/status',
      'GET /api/debug/frontend',
      'GET /api/debug/requests',
      'GET /api/debug/users',
      'GET /api/db-integrity'
    ],
    frontend: 'https://event-tracker-frontend-qv6e.onrender.com',
    backend: 'https://event-tracker-backend.onrender.com',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Database connected successfully`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
