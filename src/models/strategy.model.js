const mongoose = require('mongoose');

const entryConditionsSchema = new mongoose.Schema({
  entryLogic: { type: String },
  entryValue: { type: String },
  entryTime: { type: String },
  positionSize: { type: String },
  positionSizeType: { 
    type: String, 
    enum: ['Quantity', 'Amount', 'Percentage'],
    default: 'Quantity'
  }
});

const exitConditionsSchema = new mongoose.Schema({
  exitLogic: { type: String },
  exitValue: { type: String },
  exitTime: { type: String },
  useStopLoss: { type: Boolean, default: false },
  stopLossValue: { type: String },
  stopLossType: { 
    type: String, 
    enum: ['Price', 'Percentage'],
    default: 'Price'
  },
  useTakeProfit: { type: Boolean, default: false },
  takeProfitValue: { type: String },
  takeProfitType: { 
    type: String, 
    enum: ['Price', 'Percentage'],
    default: 'Price'
  }
});

const strategySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  instrument: { 
    type: String, 
    required: true 
  },
  deployTime: { 
    type: String 
  },
  entryConditions: { 
    type: entryConditionsSchema,
    default: () => ({})
  },
  exitConditions: { 
    type: exitConditionsSchema,
    default: () => ({})
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
  containerIds: {
    type: [String],
    default: []
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Strategy', strategySchema);