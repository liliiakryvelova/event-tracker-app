require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/eventtracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    
    // Test database connection first
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    
    // Create users table for admin authentication
    console.log('📝 Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        full_name VARCHAR(100),
        team VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📝 Creating events table...');
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

    console.log('📝 Creating attendees table...');
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

    // Create default admin user if none exists
    console.log('👤 Checking/creating default admin user...');
    await createDefaultAdminUser();

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    throw error;
  }
};

// User management functions
const createDefaultAdminUser = async () => {
  try {
    console.log('🔍 Checking for existing admin users...');
    // Check if any admin users exist
    const existingAdmin = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    
    if (existingAdmin.rows.length === 0) {
      console.log('👤 No admin users found, creating default admin...');
      // Create default admin user
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('CatchBall2025!Secure#Admin', saltRounds);
      
      await pool.query(`
        INSERT INTO users (username, password_hash, role, full_name, team)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', hashedPassword, 'admin', 'System Administrator', 'Catchball Seattle Management']);
      
      console.log('✅ Default admin user created successfully');
      console.log('📋 Username: admin');
      console.log('📋 Password: CatchBall2025!Secure#Admin');
    } else {
      console.log('✅ Admin user already exists, skipping creation');
    }
  } catch (error) {
    console.error('❌ Error creating default admin user:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  }
};

const authenticateUser = async (username, password) => {
  try {
    console.log(`🔐 Authentication attempt for user: ${username}`);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return { success: false, message: 'Invalid username or password' };
    }
    
    const user = result.rows[0];
    console.log(`🔍 User found: ${user.username}, role: ${user.role}`);
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log(`❌ Invalid password for user: ${username}`);
      return { success: false, message: 'Invalid username or password' };
    }
    
    console.log(`✅ Authentication successful for user: ${username}`);
    
    // Return user info without password hash
    const { password_hash, ...userInfo } = user;
    return { 
      success: true, 
      user: {
        id: userInfo.id,
        username: userInfo.username,
        role: userInfo.role,
        fullName: userInfo.full_name,
        team: userInfo.team
      }
    };
  } catch (error) {
    console.error('❌ Error authenticating user:', error);
    return { success: false, message: 'Authentication error' };
  }
};

const changePassword = async (userId, newPassword) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
    
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, message: 'Error updating password' };
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

  // Delete event and all related attendees (with CASCADE)
  deleteEvent: async (id) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First, check if event exists and get attendee count
      const eventCheck = await client.query('SELECT title FROM events WHERE id = $1', [id]);
      if (eventCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log(`Event ${id} not found for deletion`);
        return false;
      }
      
      const attendeeCount = await client.query('SELECT COUNT(*) FROM attendees WHERE event_id = $1', [id]);
      const eventTitle = eventCheck.rows[0].title;
      
      console.log(`Deleting event "${eventTitle}" (ID: ${id}) with ${attendeeCount.rows[0].count} attendees`);
      
      // Delete the event (attendees will be cascaded automatically due to ON DELETE CASCADE)
      const eventResult = await client.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
      
      // Verify all related data was deleted
      const remainingAttendees = await client.query('SELECT COUNT(*) FROM attendees WHERE event_id = $1', [id]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Event "${eventTitle}" deleted successfully`);
      console.log(`✅ ${attendeeCount.rows[0].count} attendees automatically deleted via CASCADE`);
      console.log(`✅ Remaining orphaned attendees: ${remainingAttendees.rows[0].count} (should be 0)`);
      
      return eventResult.rows.length > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error deleting event and attendees:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = {
  pool,
  initializeDatabase,
  dbQueries,
  authenticateUser,
  changePassword
};
