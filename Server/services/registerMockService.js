/**
 * Mock Registration Service for development
 * Used when USE_MOCK_DATA=true to avoid MongoDB dependency for registration flow
 */

// In-memory storage for registration data
let mockRegistrations = [];
let nextId = 1;

/**
 * Generate a unique ID for mock registrations
 */
const generateId = () => {
  return `mock_register_${nextId++}`;
};

/**
 * Find registration by email
 * @param {string} email - User email
 * @returns {Object|null} Registration record
 */
const findRegisterByEmail = async (email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  return mockRegistrations.find(reg => reg.email === normalizedEmail) || null;
};

/**
 * Find registration by ID
 * @param {string} id - Registration ID
 * @returns {Object|null} Registration record
 */
const findRegisterById = async (id) => {
  return mockRegistrations.find(reg => reg._id === id) || null;
};

/**
 * Create new registration record
 * @param {Object} data - Registration data
 * @returns {Object} Created registration record
 */
const createRegister = async (data) => {
  const newRegistration = {
    _id: generateId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockRegistrations.push(newRegistration);
  return newRegistration;
};

/**
 * Update existing registration record
 * @param {string} id - Registration ID
 * @param {Object} updateData - Data to update
 * @returns {Object|null} Updated registration record
 */
const updateRegister = async (id, updateData) => {
  const index = mockRegistrations.findIndex(reg => reg._id === id);
  if (index === -1) return null;
  
  mockRegistrations[index] = {
    ...mockRegistrations[index],
    ...updateData,
    updatedAt: new Date()
  };
  
  return mockRegistrations[index];
};

/**
 * Update registration by email
 * @param {string} email - User email
 * @param {Object} updateData - Data to update
 * @returns {Object|null} Updated registration record
 */
const updateRegisterByEmail = async (email, updateData) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const index = mockRegistrations.findIndex(reg => reg.email === normalizedEmail);
  if (index === -1) return null;
  
  mockRegistrations[index] = {
    ...mockRegistrations[index],
    ...updateData,
    updatedAt: new Date()
  };
  
  return mockRegistrations[index];
};

/**
 * Save registration (simulate mongoose save method)
 * @param {Object} registration - Registration object to save
 * @returns {Object} Saved registration
 */
const saveRegister = async (registration) => {
  const index = mockRegistrations.findIndex(reg => reg._id === registration._id);
  if (index !== -1) {
    registration.updatedAt = new Date();
    mockRegistrations[index] = registration;
  }
  return registration;
};

/**
 * Get all registrations (for debugging)
 * @returns {Array} All registration records
 */
const getAllRegistrations = async () => {
  return [...mockRegistrations];
};

/**
 * Clear all registrations (for testing)
 */
const clearAllRegistrations = async () => {
  mockRegistrations = [];
  nextId = 1;
};

module.exports = {
  findRegisterByEmail,
  findRegisterById,
  createRegister,
  updateRegister,
  updateRegisterByEmail,
  saveRegister,
  getAllRegistrations,
  clearAllRegistrations
};