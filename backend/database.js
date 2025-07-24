require('dotenv').config();
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/eventtracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        location VARCHAR(255) NOT NULL,
        max_attendees INTEGER,
        status VARCHAR(50) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendees (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        role VARCHAR(50) DEFAULT 'guest',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        join_order INTEGER
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database query functions
const dbQueries = {
  // Get all events with attendees
  getAllEvents: async () => {
    const eventsResult = await pool.query(`
      SELECT e.*, COUNT(a.id) as attendee_count
      FROM events e
      LEFT JOIN attendees a ON e.id = a.event_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    const events = await Promise.all(
      eventsResult.rows.map(async (event) => {
        const attendeesResult = await pool.query(
          'SELECT * FROM attendees WHERE event_id = $1 ORDER BY join_order ASC',
          [event.id]
        );
        
        return {
          id: event.id.toString(),
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          maxAttendees: event.max_attendees,
          status: event.status,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          attendees: attendeesResult.rows.map(attendee => ({
            name: attendee.name,
            team: attendee.team,
            phone: attendee.phone,
            role: attendee.role,
            joinedAt: attendee.joined_at,
            joinOrder: attendee.join_order
          }))
        };
      })
    );

    return events;
  },

  // Get single event with attendees
  getEventById: async (id) => {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    
    if (eventResult.rows.length === 0) {
      return null;
    }

    const event = eventResult.rows[0];
    const attendeesResult = await pool.query(
      'SELECT * FROM attendees WHERE event_id = $1 ORDER BY join_order ASC',
      [id]
    );

    return {
      id: event.id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      maxAttendees: event.max_attendees,
      status: event.status,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      attendees: attendeesResult.rows.map(attendee => ({
        name: attendee.name,
        team: attendee.team,
        phone: attendee.phone,
        role: attendee.role,
        joinedAt: attendee.joined_at,
        joinOrder: attendee.join_order
      }))
    };
  },

  // Create new event
  createEvent: async (eventData) => {
    const result = await pool.query(`
      INSERT INTO events (title, description, date, time, location, max_attendees, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      eventData.title,
      eventData.description,
      eventData.date,
      eventData.time,
      eventData.location,
      eventData.maxAttendees,
      eventData.status || 'planned'
    ]);

    const event = result.rows[0];
    return {
      id: event.id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      maxAttendees: event.max_attendees,
      status: event.status,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      attendees: []
    };
  },

  // Update event
  updateEvent: async (id, eventData) => {
    const result = await pool.query(`
      UPDATE events 
      SET title = $1, description = $2, date = $3, time = $4, location = $5, 
          max_attendees = $6, status = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      eventData.title,
      eventData.description,
      eventData.date,
      eventData.time,
      eventData.location,
      eventData.maxAttendees,
      eventData.status,
      id
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    // Handle attendees update
    if (eventData.attendees) {
      // Clear existing attendees
      await pool.query('DELETE FROM attendees WHERE event_id = $1', [id]);
      
      // Add new attendees
      for (let i = 0; i < eventData.attendees.length; i++) {
        const attendee = eventData.attendees[i];
        await pool.query(`
          INSERT INTO attendees (event_id, name, team, phone, role, joined_at, join_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          id,
          attendee.name,
          attendee.team,
          attendee.phone,
          attendee.role || 'guest',
          attendee.joinedAt,
          attendee.joinOrder || i + 1
        ]);
      }
    }

    return await dbQueries.getEventById(id);
  },

  // Delete event
  deleteEvent: async (id) => {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }
};

module.exports = {
  pool,
  initializeDatabase,
  dbQueries
};
