const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const providerRoutes = require('./routes/providerRoutes');
const requestRoutes = require('./routes/requestRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint for Render/health checks and quick service verification
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    app: 'CareConnect API',
    message: 'API is running. Use /api/health or /api/<resource> endpoints.',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'CareConnect API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve Frontend static build in production/monorepo deployment
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const altFrontendDistPath = path.resolve(__dirname, '../frontend/dist');

const distPath = fs.existsSync(frontendDistPath)
  ? frontendDistPath
  : (fs.existsSync(altFrontendDistPath) ? altFrontendDistPath : null);

if (distPath) {
  app.use(express.static(distPath));

  // SPA fallback for all non-API GET requests
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });
}

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
