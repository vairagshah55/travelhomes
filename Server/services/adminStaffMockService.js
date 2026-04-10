/**
 * Mock Admin Staff Service for development
 * Used when USE_MOCK_DATA=true to avoid MongoDB dependency
 */

const bcrypt = require('bcryptjs');

// Mock admin staff data
const mockAdminStaff = [
  {
    _id: "60f1a2b3c4d5e6f7a8b9c0d1",
    name: "Super Admin",
    email: "admin@travel.com",
    passwordHash: bcrypt.hashSync("admin123", 10), // Default password: admin123
    role: "Super Admin",
    status: "Active",
    joinDate: new Date("2024-01-01"),
    lastLogin: new Date(),
    permissions: ["all"]
  },
  {
    _id: "60f1a2b3c4d5e6f7a8b9c0d2", 
    name: "Staff Manager",
    email: "manager@travel.com", 
    passwordHash: bcrypt.hashSync("manager123", 10), // Default password: manager123
    role: "Manager",
    status: "Active",
    joinDate: new Date("2024-01-15"),
    lastLogin: new Date(),
    permissions: ["booking", "user_management", "analytics"]
  },
  {
    _id: "60f1a2b3c4d5e6f7a8b9c0d3",
    name: "Staff User", 
    email: "staff@travel.com",
    passwordHash: bcrypt.hashSync("staff123", 10), // Default password: staff123
    role: "Staff",
    status: "Active", 
    joinDate: new Date("2024-02-01"),
    lastLogin: new Date(),
    permissions: ["booking", "customer_support"]
  }
];

/**
 * Find admin staff by email (case insensitive)
 * @param {string} email - Admin email
 * @returns {Object|null} Admin staff object with passwordHash
 */
const findAdminByEmail = async (email) => {
  const staff = mockAdminStaff.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (!staff) return null;
  
  // Return a copy with passwordHash included (simulate .select('+passwordHash'))
  return { ...staff };
};

/**
 * Find admin staff by ID
 * @param {string} id - Admin staff ID
 * @returns {Object|null} Admin staff object without passwordHash
 */
const findAdminById = async (id) => {
  const staff = mockAdminStaff.find(s => s._id === id);
  if (!staff) return null;
  
  // Return a copy without passwordHash (simulate default behavior)
  const { passwordHash, ...staffWithoutPassword } = staff;
  return staffWithoutPassword;
};

/**
 * Update admin staff last login time
 * @param {string} id - Admin staff ID
 * @returns {boolean} Success status
 */
const updateLastLogin = async (id) => {
  const staff = mockAdminStaff.find(s => s._id === id);
  if (!staff) return false;
  
  staff.lastLogin = new Date();
  return true;
};

/**
 * Get all admin staff (for admin management)
 * @returns {Array} List of admin staff without passwords
 */
const getAllAdminStaff = async () => {
  return mockAdminStaff.map(staff => {
    const { passwordHash, ...staffWithoutPassword } = staff;
    return staffWithoutPassword;
  });
};

module.exports = {
  findAdminByEmail,
  findAdminById,
  updateLastLogin,
  getAllAdminStaff
};