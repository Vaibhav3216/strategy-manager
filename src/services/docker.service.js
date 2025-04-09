const Docker = require('dockerode');
const logger = require('../utils/logger');
const config = require('../utils/config');

// Initialize Docker client
const docker = new Docker({ socketPath: config.docker.host });

/**
 * Create and start a worker container for a strategy
 * @param {Object} strategy - The strategy object
 * @returns {Promise<String>} - The container ID of the created worker
 */
async function startWorkerContainer(strategy) {
  try {
    logger.info(`Starting worker container for strategy: ${strategy.name} (${strategy._id})`);
    
    // Create container
    const container = await docker.createContainer({
      Image: config.docker.workerImage,
      name: `strategy-executor-${strategy._id}`,
      Env: [
        `STRATEGY_ID=${strategy._id}`,
        `USER_ID=${strategy.userId}`,
        `MARKET_DATA_SERVICE_URL=${config.services.marketDataUrl}`,
        `ORDER_SERVICE_URL=${config.services.orderServiceUrl}`,
        `NOTIFICATION_SERVICE_URL=${config.services.notificationServiceUrl}`
      ],
      HostConfig: {
        NetworkMode: config.docker.workerNetwork,
        RestartPolicy: {
          Name: 'on-failure',
          MaximumRetryCount: 5
        }
      },
      Labels: {
        'app': 'strategy-executor',
        'strategy-id': strategy._id.toString(),
        'user-id': strategy.userId
      }
    });
    
    // Start the container
    await container.start();
    
    const containerId = container.id;
    logger.info(`Worker container started with ID: ${containerId}`);
    
    return containerId;
  } catch (error) {
    logger.error(`Failed to start worker container: ${error.message}`);
    throw error;
  }
}

/**
 * Stop and remove a worker container
 * @param {String} containerId - The container ID to stop
 */
async function stopWorkerContainer(containerId) {
  try {
    logger.info(`Stopping worker container: ${containerId}`);
    
    const container = docker.getContainer(containerId);
    
    // Check if container exists and is running
    const containerInfo = await container.inspect();
    
    if (containerInfo.State.Running) {
      // Stop the container
      await container.stop({ t: 10 }); // Stop with 10 second timeout
      
      // Remove the container
      await container.remove();
      
      logger.info(`Worker container ${containerId} stopped and removed successfully`);
    } else {
      logger.info(`Container ${containerId} is not running, removing it`);
      await container.remove();
    }
  } catch (error) {
    if (error.statusCode === 404) {
      logger.warn(`Container ${containerId} not found, it may have been removed already`);
    } else {
      logger.error(`Failed to stop worker container: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Get the running status of a container
 * @param {String} containerId - The container ID to check
 * @returns {Promise<Boolean>} - Whether the container is running
 */
async function isContainerRunning(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();
    return containerInfo.State.Running;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    logger.error(`Failed to check container status: ${error.message}`);
    throw error;
  }
}

/**
 * List all running strategy worker containers
 * @returns {Promise<Array>} - List of running containers
 */
async function listWorkerContainers() {
  try {
    const containers = await docker.listContainers({
      filters: {
        label: ['app=strategy-executor']
      }
    });
    
    return containers.map(container => ({
      id: container.Id,
      strategyId: container.Labels['strategy-id'],
      userId: container.Labels['user-id'],
      status: container.State,
      created: container.Created
    }));
  } catch (error) {
    logger.error(`Failed to list worker containers: ${error.message}`);
    throw error;
  }
}

module.exports = {
  startWorkerContainer,
  stopWorkerContainer,
  isContainerRunning,
  listWorkerContainers
};