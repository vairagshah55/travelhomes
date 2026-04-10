/**
 * Mock vendor data and service functions for development.
 * This CommonJS file provides in-memory operations on mock vendor array.
 */

let mockVendors = [
  {   
    
    _id: '1',
    vendorId: 'AD0343',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BadalSingh',
    brandName: 'Royal ITC',
    personName: 'Badal Singh',
    listedServices: 24,
    location: 'Jamshedpur, Jharkhand',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    vendorId: 'AD8035',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar',
    brandName: 'TAJ Renue',
    personName: 'Aman Kumar',
    listedServices: 24,
    location: 'Kolkata, West Bengal',
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    vendorId: 'CM0362',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar3',
    brandName: 'TAJ Renue',
    personName: 'Aman Kumar',
    listedServices: 24,
    location: 'Kolkata, West Bengal',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    vendorId: 'AD0344',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar2',
    brandName: 'Royal ITC',
    personName: 'Aman Kumar',
    listedServices: 18,
    location: 'Jamshedpur, Jharkhand',
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '5',
    vendorId: 'AD0345',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BadalSingh2',
    brandName: 'Royal ITC',
    personName: 'Badal Singh',
    listedServices: 30,
    location: 'Jamshedpur, Jharkhand',
    status: 'banned',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '6',
    vendorId: 'AD8036',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar4',
    brandName: 'TAJ Renue',
    personName: 'Aman Kumar',
    listedServices: 12,
    location: 'Kolkata, West Bengal',
    status: 'kyc-unverified',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Get all vendors or filter by status (async for API parity)
function getMockVendors(status) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (status) {
        let filterFn;
        switch (status) {
          case 'all-vendors':
            filterFn = () => true;
            break;
          case 'pending-vendors':
            filterFn = (v) => v.status === 'pending';
            break;
          case 'approved':
            filterFn = (v) => v.status === 'approved';
            break;
          case 'active':
            filterFn = (v) => v.status === 'active';
            break;
          case 'inactive':
            filterFn = (v) => v.status === 'inactive';
            break;
          case 'banned':
            filterFn = (v) => v.status === 'banned';
            break;
          case 'kyc-unverified':
            filterFn = (v) => v.status === 'kyc-unverified';
            break;
          default:
            filterFn = () => true;
        }
        resolve(mockVendors.filter(filterFn));
      } else {
        resolve(mockVendors);
      }
    }, 400);
  });
}

// Get a single vendor by id
function getMockVendor(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const vendor = mockVendors.find((x) => x._id === id);
      resolve(vendor || null);
    }, 300);
  });
}

// Create a new vendor (mock, returns the new vendor)
function createMockVendor(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = (mockVendors.length + 1).toString();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const vendor = {
        ...data,
        _id: newId,
        vendorId: data.vendorId || `VD${randomId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'pending',
      };
      mockVendors.push(vendor);
      resolve(vendor);
    }, 400);
  });
}

// Update a vendor (mock, returns the updated vendor)
function updateMockVendor(id, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = mockVendors.findIndex((x) => x._id === id);
      if (idx === -1) {
        resolve(null);
        return;
      }
      mockVendors[idx] = { ...mockVendors[idx], ...data, updatedAt: new Date() };
      resolve(mockVendors[idx]);
    }, 400);
  });
}

// Delete a vendor by id (mock, returns true if deleted)
function deleteMockVendor(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initial = mockVendors.length;
      mockVendors = mockVendors.filter((x) => x._id !== id);
      resolve(initial !== mockVendors.length);
    }, 400);
  });
}

module.exports = {
  getMockVendors,
  getMockVendor,
  createMockVendor,
  updateMockVendor,
  deleteMockVendor,
};