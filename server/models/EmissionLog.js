const mongoose = require('mongoose');

const emissionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['electricity', 'travel', 'shipping', 'fuel'],
      required: true,
    },
    activityData: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
    },
    co2e: {
      type: Number,
      required: true,
    },
    co2e_unit: {
      type: String,
      default: 'kg',
    },
    region: {
      type: String,
      maxlength: 2,
      minlength: 2,
    },
    scope: {
      type: String,
      enum: ['Scope 1', 'Scope 2', 'Scope 3'],
    },
    rawMessage: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('EmissionLog', emissionLogSchema);
