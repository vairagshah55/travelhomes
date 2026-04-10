const mongoose = require('mongoose');
const { Schema } = mongoose;

const PluginSchema = new Schema(
  {
    vendorName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    },
    licenseKey: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
// PluginSchema.index({ enabled: 1 });

module.exports = mongoose.model('Plugin', PluginSchema);