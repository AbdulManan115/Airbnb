require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  const { MONGODB_URI } = process.env;

  console.log('🔍 Testing MongoDB Connection...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not defined in .env file');
    process.exit(1);
  }

  console.log('📋 Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('');

  try {
    console.log('⏳ Attempting to connect...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });
    console.log('✅ MongoDB connected successfully!');
    console.log('✅ Database:', mongoose.connection.db.databaseName);
    console.log('✅ Host:', mongoose.connection.host);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB connection failed!\n');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('\n💡 Common Solutions:');
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('  1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('     - Go to MongoDB Atlas → Network Access → Add IP Address');
      console.error('     - For development, you can use 0.0.0.0/0 (all IPs)');
      console.error('  2. Check if your MongoDB Atlas cluster is running (not paused)');
      console.error('  3. Verify your internet connection');
    } else if (error.name === 'MongoAuthenticationError') {
      console.error('  1. Check your username and password in the connection string');
      console.error('  2. Make sure special characters in password are URL-encoded');
      console.error('     - @ becomes %40');
      console.error('     - # becomes %23');
      console.error('     - % becomes %25');
      console.error('  3. Verify the user exists and has proper permissions');
    } else if (error.name === 'MongoNetworkError' || error.message.includes('ECONNREFUSED')) {
      console.error('  1. Check your internet connection');
      console.error('  2. Verify the connection string is correct');
      console.error('  3. Check if MongoDB Atlas cluster is accessible');
    } else {
      console.error('  1. Verify the connection string format is correct');
      console.error('  2. Check MongoDB Atlas dashboard for any issues');
      console.error('  3. Try regenerating the connection string in Atlas');
    }
    
    process.exit(1);
  }
};

testConnection();

