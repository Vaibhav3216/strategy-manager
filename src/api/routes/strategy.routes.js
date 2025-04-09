const express = require('express');
const router = express.Router();
const strategyController = require('../controllers/strategy.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Get all strategies for the authenticated user
router.get('/', strategyController.getStrategies);

// Get a specific strategy
router.get('/:id', strategyController.getStrategyById);

// Create a new strategy
router.post('/', strategyController.createStrategy);

// Update a strategy
router.put('/:id', strategyController.updateStrategy);

// Delete a strategy
router.delete('/:id', strategyController.deleteStrategy);

// Activate a strategy
router.post('/:id/activate', strategyController.activateStrategy);

// Deactivate a strategy
router.post('/:id/deactivate', strategyController.deactivateStrategy);

// Get all running worker containers
router.get('/workers/running', strategyController.getRunningWorkers);

module.exports = router;