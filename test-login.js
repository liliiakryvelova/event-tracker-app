// Quick test script for login functionality
const { authenticateUser } = require('./backend/database');

async function testLogin() {
  console.log('🧪 Testing login functionality...');
  
  try {
    const result = await authenticateUser('admin', 'CatchBall2025!Secure#Admin');
    console.log('✅ Login test result:', result);
    
    if (result.success) {
      console.log('🎉 Login works! User:', result.user);
    } else {
      console.log('❌ Login failed:', result.message);
    }
  } catch (error) {
    console.error('💥 Login test error:', error);
  }
  
  process.exit(0);
}

testLogin();
