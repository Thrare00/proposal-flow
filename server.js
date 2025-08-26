import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_PATH = '/proposal-flow';
const isProduction = NODE_ENV === 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: isProduction 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // More lenient in development
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all API routes
app.use(`${BASE_PATH}/api`, limiter);

// Request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body parsing and compression
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression({ level: 6, threshold: 100 * 1024 })); // Compress responses over 100KB

// API Routes
app.get(`${BASE_PATH}/api/health`, (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Mock API endpoints for proposals
app.get(`${BASE_PATH}/api/proposals`, (req, res) => {
  try {
    // In a real app, this would query a database
    const mockProposals = [
      {
        id: '1',
        title: 'Sample Proposal',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    res.json(mockProposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Error handling for non-existent API routes
app.all(`${BASE_PATH}/api/*`, (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    path: req.path
  });
});

// Serve static files from the React app under the base path
app.use(BASE_PATH, express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Root redirect to the SPA base path
app.get('/', (req, res) => {
  res.redirect(BASE_PATH);
});

// SPA fallback (keeps client-side routing working under the base path)
app.get([BASE_PATH, `${BASE_PATH}/*`], (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  
  // Log server errors (not client errors)
  if (!isClientError) {
    console.error(`[${new Date().toISOString()}] Error:`, {
      message: err.message,
      stack: NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Don't leak error details in production
  const errorResponse = {
    status: 'error',
    message: isProduction && !isClientError ? 'Internal server error' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
});

// 404 handler for non-API routes
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Error:', err);
  
  // Give time for logs to be written
  setTimeout(() => {
    server.close(() => {
      process.exit(1);
    });
  }, 1000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error:', err);
  
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Server started successfully!
  ==============================
  Environment: ${NODE_ENV}
  Listening on: http://localhost:${PORT}${BASE_PATH}
  API Base URL: http://localhost:${PORT}${BASE_PATH}/api
  Health Check: http://localhost:${PORT}${BASE_PATH}/api/health
  ==============================
  `);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
