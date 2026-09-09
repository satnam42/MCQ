const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 500, // 500 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.', errorCode: 'RATE_LIMIT_EXCEEDED' },
});
app.use('/api', limiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Punjabi Lecturer Cadre API is running', timestamp: new Date().toISOString() });
});

// Primary Routes
app.use('/api', routes);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
