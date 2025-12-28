const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import Firebase config
const { admin, db, initialized } = require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const accountRoutes = require('./routes/accounts');
const reportRoutes = require('./routes/reports');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Security middleware
app.use(helmet()); // Set security headers
app.use(xss()); // Sanitize data to prevent XSS attacks
app.use(mongoSanitize()); // Sanitize data to prevent MongoDB operator injection

// Middleware
app.use(cors());
app.use(express.json());

// Make Firebase DB available to routes (if initialized)
if (initialized) {
  app.use((req, res, next) => {
    req.db = db;
    req.admin = admin;
    next();
  });
} else {
  // If Firebase is not initialized, provide mock DB for development
  app.use((req, res, next) => {
    req.db = {
      collection: () => ({
        where: () => ({
          limit: () => ({
            get: () => Promise.resolve({ empty: true, docs: [], forEach: (fn) => {} })
          }),
          orderBy: () => ({
            get: () => Promise.resolve({ empty: true, docs: [], forEach: (fn) => {} })
          }),
          get: () => Promise.resolve({ empty: true, docs: [], forEach: (fn) => {} })
        }),
        orderBy: () => ({
          get: () => Promise.resolve({ empty: true, docs: [], forEach: (fn) => {} })
        }),
        add: () => Promise.resolve({ id: 'mock-id' }),
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        get: () => Promise.resolve({ empty: true, docs: [], forEach: (fn) => {} })
      })
    };
    req.admin = admin;
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Budgeting App API is running!',
    firebaseInitialized: initialized
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (!initialized) {
    console.warn('WARNING: Firebase is not initialized. Using mock database.');
  }
});