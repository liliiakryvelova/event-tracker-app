require('dotenv').config();
const { Pool } = require('pg');

console.log('🔄 Testing database connection...');
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Database time:', result.rows[0].current_time);
    
    client.release();
    await pool.end();
    console.log('🎉 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
