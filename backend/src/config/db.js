const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.DB_URL || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('[MongoDB] DB_URL / MONGODB_URI is missing. Set it in your environment before starting the app.');
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
