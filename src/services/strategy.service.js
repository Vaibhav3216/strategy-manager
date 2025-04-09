const Strategy = require('../models/strategy.model');
const dockerService = require('./docker.service');
const logger = require('../utils/logger');

/**
 * Get all strategies for a user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - List of strategies
 */
async function getStrategies(userId) {
  try {
    return await Strategy.find({ userId });
  } catch (error) {
    logger.error(`Failed to get strategies: ${error.message}`);
    throw error;
  }
}

/**
 * Get a specific strategy by ID
 * @param {String} strategyId - The strategy ID
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - The strategy object
 */
async function getStrategyById(strategyId, userId) {
  try {
    const strategy = await Strategy.findOne({ _id: strategyId, userId });
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    return strategy;
  } catch (error) {
    logger.error(`Failed to get strategy: ${error.message}`);
    throw error;
  }
}

/**
 * Create a new strategy
 * @param {Object} strategyData - The strategy data
 * @returns {Promise<Object>} - The created strategy
 */
async function createStrategy(strategyData) {
  try {
    const strategy = new Strategy(strategyData);
    return await strategy.save();
  } catch (error) {
    logger.error(`Failed to create strategy: ${error.message}`);
    throw error;
  }
}

/**
 * Update an existing strategy
 * @param {String} strategyId - The strategy ID
 * @param {String} userId - The user ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated strategy
 */
async function updateStrategy(strategyId, userId, updateData) {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: strategyId, userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    return strategy;
  } catch (error) {
    logger.error(`Failed to update strategy: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a strategy
 * @param {String} strategyId - The strategy ID
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - The deleted strategy
 */
async function deleteStrategy(strategyId, userId) {
  try {
    // First stop any running containers for this strategy
    const strategy = await Strategy.findOne({ _id: strategyId, userId });
    
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    // Stop all containers associated with this strategy
    if (strategy.containerIds && strategy.containerIds.length > 0) {
      for (const containerId of strategy.containerIds) {
        await dockerService.stopWorkerContainer(containerId);
      }
    }
    
    // Then delete the strategy from the database
    return await Strategy.findOneAndDelete({ _id: strategyId, userId });
  } catch (error) {
    logger.error(`Failed to delete strategy: ${error.message}`);
    throw error;
  }
}

/**
 * Activate a strategy (deploy the worker container)
 * @param {String} strategyId - The strategy ID
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - The activated strategy
 */
async function activateStrategy(strategyId, userId) {
  try {
    // Get the strategy
    const strategy = await Strategy.findOne({ _id: strategyId, userId });
    
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    // Check if the strategy is already active
    if (strategy.isActive && strategy.containerIds.length > 0) {
      // Check if all containers are running
      const runningContainers = [];
      
      for (const containerId of strategy.containerIds) {
        const isRunning = await dockerService.isContainerRunning(containerId);
        
        if (isRunning) {
          runningContainers.push(containerId);
        }
      }
      
      // If all containers are running, no need to start new ones
      if (runningContainers.length === strategy.containerIds.length) {
        logger.info(`Strategy ${strategyId} is already active with running containers`);
        return strategy;
      }
      
      // Update the container list with only running containers
      strategy.containerIds = runningContainers;
    }
    
    // Start a new worker container
    const containerId = await dockerService.startWorkerContainer(strategy);
    
    // Update the strategy with the new container ID and set it to active
    strategy.containerIds.push(containerId);
    strategy.isActive = true;
    strategy.deployTime = new Date().toISOString();
    
    await strategy.save();
    
    logger.info(`Strategy ${strategyId} activated successfully`);
    return strategy;
  } catch (error) {
    logger.error(`Failed to activate strategy: ${error.message}`);
    throw error;
  }
}

/**
 * Deactivate a strategy (stop the worker container)
 * @param {String} strategyId - The strategy ID
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - The deactivated strategy
 */
async function deactivateStrategy(strategyId, userId) {
  try {
    // Get the strategy
    const strategy = await Strategy.findOne({ _id: strategyId, userId });
    
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    // Stop all containers associated with this strategy
    if (strategy.containerIds && strategy.containerIds.length > 0) {
      for (const containerId of strategy.containerIds) {
        await dockerService.stopWorkerContainer(containerId);
      }
    }
    
    // Update the strategy to inactive with no containers
    strategy.containerIds = [];
    strategy.isActive = false;
    
    await strategy.save();
    
    logger.info(`Strategy ${strategyId} deactivated successfully`);
    return strategy;
  } catch (error) {
    logger.error(`Failed to deactivate strategy: ${error.message}`);
    throw error;
  }
}

/**
 * Load all active strategies and ensure they have running containers
 * @returns {Promise<Array>} - List of activated strategies
 */
async function loadActiveStrategies() {
  try {
    logger.info('Loading all active strategies');
    
    // Get all active strategies
    const activeStrategies = await Strategy.find({ isActive: true });
    
    logger.info(`Found ${activeStrategies.length} active strategies`);
    
    // Get all running worker containers
    const runningContainers = await dockerService.listWorkerContainers();
    const runningContainerIds = runningContainers.map(container => container.id);
    
    // For each active strategy, ensure there's a running container
    const activatedStrategies = [];
    
    for (const strategy of activeStrategies) {
      // Filter out container IDs that are not running
      const runningStrategyContainers = strategy.containerIds.filter(
        containerId => runningContainerIds.includes(containerId)
      );
      
      // If no containers are running, start a new one
      if (runningStrategyContainers.length === 0) {
        logger.info(`Strategy ${strategy._id} is active but has no running containers, starting a new one`);
        
        const containerId = await dockerService.startWorkerContainer(strategy);
        
        // Update the strategy with the new container ID
        strategy.containerIds = [containerId];
        await strategy.save();
      } else {
        // Update the strategy with only the running containers
        strategy.containerIds = runningStrategyContainers;
        await strategy.save();
      }
      
      activatedStrategies.push(strategy);
    }
    
    logger.info(`Successfully loaded ${activatedStrategies.length} active strategies`);
    return activatedStrategies;
  } catch (error) {
    logger.error(`Failed to load active strategies: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  activateStrategy,
  deactivateStrategy,
  loadActiveStrategies
};