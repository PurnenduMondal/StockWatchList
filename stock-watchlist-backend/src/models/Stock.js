import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Stock symbol is required'],
    uppercase: true,
    trim: true,
    minlength: [1, 'Stock symbol must be at least 1 character'],
    maxlength: [100, 'Stock symbol must not exceed 100 characters']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Stock name must not exceed 100 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User is required'],
    ref: 'User'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for user-specific stocks and uniqueness per user
stockSchema.index({ user: 1, symbol: 1 }, { unique: true });
stockSchema.index({ user: 1, addedAt: -1 });

// Pre-save middleware to update lastUpdated
stockSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to validate stock symbol
stockSchema.statics.isValidSymbol = function(symbol) {
  const regex = /^[A-Z]{1,5}$/;
  return regex.test(symbol);
};

// Instance method to format stock data
stockSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    symbol: this.symbol,
    name: this.name,
    addedAt: this.addedAt,
    lastUpdated: this.lastUpdated
  };
};

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;