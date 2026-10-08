const path = require('path');
const fs = require('fs');

const envCandidates = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}

const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const seedData = require('./config/seed');

const PORT = process.env.PORT || 5000;

// Start listening immediately so Render and health checks pass without waiting on external DB
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 CareConnect API Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Connect to MongoDB asynchronously
connectDB().then(async (conn) => {
  if (conn) {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Seed] Database is empty. Running initial demo seed...');
        await seedData({ closeOnComplete: false });
        console.log('[Seed] Initial demo seed completed successfully.');
      }
    } catch (seedErr) {
      console.error('[Seed Error during startup]', seedErr.message);
    }
  }
}).catch((err) => {
  console.error(`[MongoDB] Initial connection error: ${err.message}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});
