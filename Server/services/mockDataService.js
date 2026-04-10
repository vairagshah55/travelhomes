/**
 * Mock data service for Management module - pure JavaScript, all TypeScript residues removed.
 */

// MOCK DATA (Example structure; extend as needed)
let mockListings = [
  {
    _id: "1",
    title: "Sample Listing 1",
    status: "approved",
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    // Add all realistic fields as in your real model
  },
  {
    _id: "2",
    title: "Sample Listing 2",
    status: "pending",
    createdAt: new Date("2024-01-02T10:00:00Z"),
    updatedAt: new Date("2024-01-02T10:20:00Z"),
  }
];

// List all listings, filtering by status if given
const getMockListings = (status) => {
  return new Promise(resolve => {
    setTimeout(() => {
      let list = [...mockListings];
      if (status && status !== "all") {
        list = list.filter(item => item.status === status);
      }
      resolve(list.sort((a, b) => b.createdAt - a.createdAt));
    }, 200);
  });
};

const getMockListing = (id) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const found = mockListings.find(item => item._id === id) || null;
      resolve(found);
    }, 150);
  });
};

const createMockListing = (data) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newId = (mockListings.length + 1).toString();
      const item = {
        ...data,
        _id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockListings.push(item);
      resolve(item);
    }, 150);
  });
};

const updateMockListing = (id, data) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const idx = mockListings.findIndex(item => item._id === id);
      if (idx === -1) return resolve(null);
      mockListings[idx] = { ...mockListings[idx], ...data, updatedAt: new Date() };
      resolve(mockListings[idx]);
    }, 150);
  });
};

const deleteMockListing = (id) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const initial = mockListings.length;
      mockListings = mockListings.filter(item => item._id !== id);
      resolve(initial !== mockListings.length);
    }, 150);
  });
};

module.exports = {
  getMockListings,
  getMockListing,
  createMockListing,
  updateMockListing,
  deleteMockListing
};