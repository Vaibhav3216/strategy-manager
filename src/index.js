const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./utils/config');
const logger = require('./utils/logger');
const dbService = require('./services/db.service');
const strategyService = require('./services/strategy.service');
const strategyRoutes = require('./api/routes/strategy.routes');
const { errorHandler, notFound } = require('./api/middleware/error.middleware');

// Initialize Express app
const app = express();

// Apply middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request body
app.use(morgan('dev')); // HTTP request logging

// Define routes
app.use('/api/strategies', strategyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Connect to MongoDB and start the server
async function startServer() {
  try {
    // Connect to MongoDB
    await dbService.connect();
    
    // Start the server
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
    });
    
    // Load active strategies on startup
    await strategyService.loadActiveStrategies();
    
    // Handle server shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
      });
    });
    
    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
module.exports = {
  app,
  startServer
};