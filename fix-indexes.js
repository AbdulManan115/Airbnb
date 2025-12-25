// Run this script once to drop all indexes and let Mongoose recreate them
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('./config/db');

const fixIndexes = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get all collections
    const collections = await mongoose.connection.db.collections();

    console.log('Dropping indexes from all collections...');

    for (const collection of collections) {
      try {
        // Drop all indexes except _id
        await collection.dropIndexes();
        console.log(`✅ Dropped indexes from ${collection.collectionName}`);
      } catch (error) {
        if (error.code === 26) {
          console.log(`⚠️  ${collection.collectionName}: No indexes to drop`);
        } else {
          console.log(`❌ Error dropping indexes from ${collection.collectionName}:`, error.message);
        }
      }
    }

    console.log('\n✅ Index cleanup complete!');
    console.log('Restart your server to let Mongoose recreate the indexes.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixIndexes();

