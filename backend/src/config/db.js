const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'development' ? 'mongodb://127.0.0.1:27017/careconnect' : null);

  if (!mongoUri) {
    console.error('[MongoDB] MONGODB_URI is missing. Set it in your environment before starting the app.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
