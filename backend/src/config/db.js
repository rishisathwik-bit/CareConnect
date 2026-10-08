const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for MongoDB SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if running in a restricted sandbox where setServers is not allowed
}

const connectDB = async () => {
  const mongoUri = process.env.DB_URL;

  if (!mongoUri) {
    throw new Error('DB_URL is not defined. Set it in the backend .env file.');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn('[MongoDB] Server will stay alive to handle requests and retry connection...');
    // Schedule a background retry after 5 seconds instead of terminating the process
    setTimeout(connectDB, 5000);
    return null;
  }
};

module.exports = connectDB;
