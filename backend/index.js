const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase, dbQueries, pool } = require('./database');

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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend build
const frontendPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendPath));

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

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Event Tracker API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/events': 'Get all events',
      'GET /api/events/:id': 'Get single event by ID',
      'POST /api/events': 'Create new event',
      'PUT /api/events/:id': 'Update event',
      'DELETE /api/events/:id': 'Delete event',
      'GET /api/health': 'Health check',
      'GET /api/status': 'Database status'
    },
    frontend: 'https://event-tracker-app-frontend.onrender.com',
    documentation: 'Visit the endpoints above to interact with the API'
  });
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await dbQueries.getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
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
    const updatedEvent = await dbQueries.updateEvent(req.params.id, req.body);
    
    if (updatedEvent) {
      console.log(`Updated event: ${updatedEvent.title} (ID: ${updatedEvent.id})`);
      console.log(`Attendees: ${updatedEvent.attendees?.length || 0}`);
      res.json(updatedEvent);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error updating event:', error);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const events = await readEvents();
    const stats = await fs.stat(EVENTS_DB_PATH);
    
    res.json({
      status: 'OK',
      totalEvents: events.length,
      totalAttendees: events.reduce((total, event) => total + (event.attendees?.length || 0), 0),
      lastModified: stats.mtime,
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

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
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
