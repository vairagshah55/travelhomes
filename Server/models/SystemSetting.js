// SystemSetting Mongoose Model (clean JS; robust, flexible for all system configs)
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SystemSettingSchema = new Schema(
  {
    userType: { type: String, required: true, unique: true, enum: ['Vendor', 'Admin', 'SuperAdmin', 'Staff'], default: 'Vendor' },
    // Common system/business settings:
    taxRate: { type: Number, default: 0 },                        // e.g. 18 for 18%
    currency: { type: String, default: 'INR' },                   // 'INR', 'USD', etc.
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    supportPhone: { type: String, default: '' },
    payoutBankName: { type: String },
    payoutAccount: { type: String },
    payoutIFSC: { type: String },
    termsUrl: { type: String },
    privacyUrl: { type: String },
    cancellationPolicy: { type: String },
    refundPolicy: { type: String },
    // Add more system config fields as needed...

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Always update updatedAt
SystemSettingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);