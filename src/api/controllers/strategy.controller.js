const strategyService = require('../../services/strategy.service');
const dockerService = require('../../services/docker.service');
const logger = require('../../utils/logger');

/**
 * Get all strategies for authenticated user
 */
async function getStrategies(req, res, next) {
  try {
    const userId = req.user.c; // Assuming userId is stored in the JWT as 'c'
    const strategies = await strategyService.getStrategies(userId);
    
    res.status(200).json({
      success: true,
      count: strategies.length,
      data: strategies
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific strategy by ID
 */
async function getStrategyById(req, res, next) {
  try {
    const userId = req.user.c;
    const strategyId = req.params.id;
    
    const strategy = await strategyService.getStrategyById(strategyId, userId);
    
    res.status(200).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new strategy
 */
async function createStrategy(req, res, next) {
  try {
    const userId = req.user.c;
    
    // Add the userId to the strategy data
    const strategyData = {
      ...req.body,
      userId
    };
    
    const strategy = await strategyService.createStrategy(strategyData);
    
    res.status(201).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing strategy
 */
async function updateStrategy(req, res, next) {
  try {
    const userId = req.user.c;
    const strategyId = req.params.id;
    
    const strategy = await strategyService.updateStrategy(strategyId, userId, req.body);
    
    res.status(200).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a strategy
 */
async function deleteStrategy(req, res, next) {
  try {
    const userId = req.user.c;
    const strategyId = req.params.id;
    
    await strategyService.deleteStrategy(strategyId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Activate a strategy
 */
async function activateStrategy(req, res, next) {
  try {
    const userId = req.user.c;
    const strategyId = req.params.id;
    
    const strategy = await strategyService.activateStrategy(strategyId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Strategy activated successfully',
      data: strategy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deactivate a strategy
 */
async function deactivateStrategy(req, res, next) {
  try {
    const userId = req.user.c;
    const strategyId = req.params.id;
    
    const strategy = await strategyService.deactivateStrategy(strategyId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Strategy deactivated successfully',
      data: strategy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all running workers
 */
async function getRunningWorkers(req, res, next) {
  try {
    const workers = await dockerService.listWorkerContainers();
    
    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    next(error);
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
  getRunningWorkers
};