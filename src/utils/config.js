const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-strategies',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_for_dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  docker: {
    host: process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
    workerImage: process.env.WORKER_IMAGE || 'strategy-executor:latest',
    workerNetwork: process.env.WORKER_NETWORK || 'trading-network',
  },
  services: {
    marketDataUrl: process.env.MARKET_DATA_SERVICE_URL || 'http://market-data-service:3001',
    orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003',
  },
};