const mongoose = require('mongoose');
const { Schema } = mongoose;

// Available features (update as needed for your application)
const AVAILABLE_FEATURES = [
  'access_bookings',
  'manage_users',
  'manage_vendors',
  'manage_activities',
  'manage_inventory',
  'manage_payments',
  'view_analytics',
  'manage_roles',
  'support_tickets',
  'view_dashboard',
  'access_management',
  'manage_cms',
  'manage_marketing',
  'manage_plugins',
  'manage_staff'
];

// Permission sub-document schema, for fine-grained permissions per feature
const PermissionSchema = new Schema({
  feature: { type: String, required: true },
  canView: { type: Boolean, default: true },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  canCreate: { type: Boolean, default: false }
}, { _id: false });

const AdminRoleSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  features: [{
    type: String,
    enum: AVAILABLE_FEATURES,
    default: []
  }],
  permissions: {
    type: [PermissionSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminStaff'
  }
}, {
  timestamps: true
});

// Model static to expose available features API-side
AdminRoleSchema.statics.AVAILABLE_FEATURES = AVAILABLE_FEATURES;

// Indexes for dashboard/stat filtering
AdminRoleSchema.index({ isActive: 1, name: 1 });

const AdminRole = mongoose.models.AdminRole || mongoose.model('AdminRole', AdminRoleSchema);

module.exports = AdminRole;