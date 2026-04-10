// Mock onboarding service for development

const fs = require('fs');
const path = require('path');

// Simple in-memory storage for mock data
let activityOnboarding = [];
let caravanOnboarding = [];
let stayOnboarding = [];

// Helper to generate mock IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Helper to save data to file (for persistence across server restarts)
const saveToFile = (type, data) => {
  try {
    const filePath = path.join(__dirname, `../mock_data/${type}_onboarding.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn(`Could not save ${type} onboarding mock data:`, error.message);
  }
};

// Helper to load data from file
const loadFromFile = (type) => {
  try {
    const filePath = path.join(__dirname, `../mock_data/${type}_onboarding.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Could not load ${type} onboarding mock data:`, error.message);
  }
  return [];
};

// Load existing data on startup
activityOnboarding = loadFromFile('activity');
caravanOnboarding = loadFromFile('caravan');
stayOnboarding = loadFromFile('stay');

const onboardingMockService = {
  // Activity onboarding
  createActivity: async (data) => {
    const newActivity = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    activityOnboarding.push(newActivity);
    saveToFile('activity', activityOnboarding);
    
    console.log('[MOCK] Activity onboarding created:', newActivity._id);
    return newActivity;
  },

  getActivity: async (id) => {
    return activityOnboarding.find(item => item._id === id);
  },

  listActivities: async (limit = 100) => {
    return activityOnboarding.slice(-limit).reverse();
  },

  updateActivitySelfie: async (id, imageData) => {
    const activity = activityOnboarding.find(item => item._id === id);
    if (!activity) return null;

    if (!activity.idPhotos) activity.idPhotos = [];
    activity.idPhotos.push(imageData);
    activity.updatedAt = new Date().toISOString();
    
    saveToFile('activity', activityOnboarding);
    return activity;
  },

  // Caravan onboarding
  createCaravan: async (data) => {
    const newCaravan = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    caravanOnboarding.push(newCaravan);
    saveToFile('caravan', caravanOnboarding);
    
    console.log('[MOCK] Caravan onboarding created:', newCaravan._id);
    return newCaravan;
  },

  getCaravan: async (id) => {
    return caravanOnboarding.find(item => item._id === id);
  },

  listCaravans: async (limit = 100) => {
    return caravanOnboarding.slice(-limit).reverse();
  },

  updateCaravanSelfie: async (id, imageData) => {
    const caravan = caravanOnboarding.find(item => item._id === id);
    if (!caravan) return null;

    if (!caravan.idPhotos) caravan.idPhotos = [];
    caravan.idPhotos.push(imageData);
    caravan.updatedAt = new Date().toISOString();
    
    saveToFile('caravan', caravanOnboarding);
    return caravan;
  },

  // Stay onboarding
  createStay: async (data) => {
    const newStay = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    stayOnboarding.push(newStay);
    saveToFile('stay', stayOnboarding);
    
    console.log('[MOCK] Stay onboarding created:', newStay._id);
    return newStay;
  },

  getStay: async (id) => {
    return stayOnboarding.find(item => item._id === id);
  },

  listStays: async (limit = 100) => {
    return stayOnboarding.slice(-limit).reverse();
  },

  updateStaySelfie: async (id, imageData) => {
    const stay = stayOnboarding.find(item => item._id === id);
    if (!stay) return null;

    if (!stay.images) stay.images = [];
    stay.images.push(imageData);
    stay.updatedAt = new Date().toISOString();
    
    saveToFile('stay', stayOnboarding);
    return stay;
  },

  // Utility methods
  clearAll: () => {
    activityOnboarding = [];
    caravanOnboarding = [];
    stayOnboarding = [];
    saveToFile('activity', activityOnboarding);
    saveToFile('caravan', caravanOnboarding);
    saveToFile('stay', stayOnboarding);
  },

  getStats: () => {
    return {
      activities: activityOnboarding.length,
      caravans: caravanOnboarding.length,
      stays: stayOnboarding.length,
      total: activityOnboarding.length + caravanOnboarding.length + stayOnboarding.length
    };
  }
};

module.exports = onboardingMockService;