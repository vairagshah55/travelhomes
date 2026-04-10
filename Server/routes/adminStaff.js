const express = require('express');
const bcrypt = require('bcryptjs');
const AdminStaff = require('../models/AdminStaff');
const AdminRole = require('../models/AdminRole');

const router = express.Router();

/**
 * List staff with search/filter/pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      status,
      role,
      department,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      const pattern = new RegExp(search, 'i');
      query.$or = [
        { name: pattern },
        { email: pattern },
        { role: pattern },
        { department: pattern }
      ];
    }
    if (status && (status === 'Active' || status === 'Inactive')) query.status = status;
    if (role) query.role = new RegExp(role, 'i');
    if (department) query.department = new RegExp(department, 'i');

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [String(sortBy)]: sortOrder === 'asc' ? 1 : -1 };

    const staff = await AdminStaff.find(query)
      .populate('roleId', 'name features permissions')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await AdminStaff.countDocuments(query);

    res.json({
      success: true,
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum * limitNum < total,
      staff
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get a single staff member
 */
router.get('/:id', async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id)
      .populate('roleId', 'name features permissions');
    if (!staff)
      return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create staff
 */
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      status = 'Active',
      department,
      salary,
      address,
      emergencyContact,
      password
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !role)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const exists = await AdminStaff.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: 'Staff already exists' });

    let roleId;
    const roleDoc = await AdminRole.findOne({ name: role });
    if (roleDoc) roleId = roleDoc._id;

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else {
      // Default password for new staff
      passwordHash = await bcrypt.hash('Password@123', 10);
    }

    const doc = new AdminStaff({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      phone,
      role,
      roleId,
      status,
      department,
      salary,
      address,
      emergencyContact,
      joinDate: new Date(),
      passwordHash
    });

    const saved = await doc.save();
    await saved.populate('roleId', 'name features permissions');
    res.status(201).json({ success: true, staff: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update staff
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, role,
      status, department, salary, address, emergencyContact, avatar, password
    } = req.body;

    const staff = await AdminStaff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    if (email && email.toLowerCase() !== staff.email) {
      const exists = await AdminStaff.findOne({ email, _id: { $ne: req.params.id } });
      if (exists)
        return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    let roleId = staff.roleId;
    if (role && role !== staff.role) {
      const r = await AdminRole.findOne({ name: role });
      if (r) roleId = r._id;
    }

    if (firstName) staff.firstName = firstName;
    if (lastName) staff.lastName = lastName;
    if (firstName || lastName)
      staff.name = `${firstName || staff.firstName} ${lastName || staff.lastName}`;
    if (email) staff.email = email.toLowerCase();
    if (phone) staff.phone = phone;
    if (role) staff.role = role;
    if (roleId) staff.roleId = roleId;
    if (status) staff.status = status;
    if (department !== undefined) staff.department = department;
    if (salary !== undefined) staff.salary = salary;
    if (address) staff.address = { ...staff.address, ...address };
    if (emergencyContact) staff.emergencyContact = { ...staff.emergencyContact, ...emergencyContact };
    if (avatar !== undefined) staff.avatar = avatar;
    if (password) staff.passwordHash = await bcrypt.hash(password, 10);

    const updated = await staff.save();
    await updated.populate('roleId', 'name features permissions');
    res.json({ success: true, staff: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Toggle status
 */
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    staff.status = staff.status === 'Active' ? 'Inactive' : 'Active';
    const updated = await staff.save();
    await updated.populate('roleId', 'name features permissions');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update last login
 */
router.patch('/:id/last-login', async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    staff.lastLogin = new Date();
    const updated = await staff.save();
    res.json({ success: true, staff: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete staff
 */
router.delete('/:id', async (req, res) => {
  try {
    const staff = await AdminStaff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ success: false, message: 'Staff not found' });

    await AdminStaff.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Bulk status update
 */
router.post('/bulk/status', async (req, res) => {
  try {
    const { staffIds, status } = req.body;
    if (!Array.isArray(staffIds) || staffIds.length === 0)
      return res.status(400).json({ success: false, message: 'No staff IDs provided' });
    if (!status || (status !== 'Active' && status !== 'Inactive'))
      return res.status(400).json({ success: false, message: 'Invalid status value' });

    const result = await AdminStaff.updateMany(
      { _id: { $in: staffIds } },
      { $set: { status } }
    );
    res.json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Stats overview
 */
router.get('/stats/overview', async (_req, res) => {
  try {
    const totalStaff = await AdminStaff.countDocuments();
    const activeStaff = await AdminStaff.countDocuments({ status: 'Active' });
    const inactiveStaff = await AdminStaff.countDocuments({ status: 'Inactive' });

    // Aggregate staff by role
    const staffByRole = await AdminStaff.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Aggregate staff by department
    const staffByDepartment = await AdminStaff.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Recent joiners (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentJoiners = await AdminStaff.countDocuments({ joinDate: { $gte: thirtyDaysAgo } });

    res.json({
      success: true,
      totalStaff,
      activeStaff,
      inactiveStaff,
      staffByRole,
      staffByDepartment,
      recentJoiners
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Initialize default staff (dev purpose)
 */
router.post('/initialize', async (_req, res) => {
  try {
    const existing = await AdminStaff.find({});
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Default staff already exists' });

    const defaultStaff = [
      {
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        role: 'Manager',
        status: 'Active',
        department: 'Management',
        joinDate: new Date('2024-01-15')
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 234-5678',
        role: 'Accountant',
        status: 'Active',
        department: 'Finance',
        joinDate: new Date('2024-02-20')
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        phone: '+1 (555) 345-6789',
        role: 'Support',
        status: 'Inactive',
        department: 'Customer Service',
        joinDate: new Date('2024-03-10')
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        phone: '+1 (555) 456-7890',
        role: 'Manager',
        status: 'Active',
        department: 'Operations',
        joinDate: new Date('2024-01-25')
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        name: 'David Brown',
        email: 'david.brown@example.com',
        phone: '+1 (555) 567-8901',
        role: 'Accountant',
        status: 'Active',
        department: 'Finance',
        joinDate: new Date('2024-03-05')
      }
    ];

    const created = await AdminStaff.insertMany(defaultStaff);
    res.status(201).json({ success: true, staff: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;