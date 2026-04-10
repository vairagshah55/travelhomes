// Mock service for user data when MongoDB is not available
// Use this for development without database connection

let mockUsers = [
  {
    _id: '1',
    userId: 'AD0343',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BadalSingh',
    name: 'Badal Singh',
    userSince: '2025',
    bookedServices: 'XYX',
    location: 'Jamshedpur, Jharkhand',
    email: 'badal.singh@example.com',
    phone: '+91 9876543210',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    userId: 'AD8035',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar',
    name: 'Aman Kumar',
    userSince: '2021',
    bookedServices: 'XYZ',
    location: 'Kolkata, West Bengal',
    email: 'aman.kumar@example.com',
    phone: '+91 9876543211',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    userId: 'AD0343',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar2',
    name: 'Aman Kumar',
    userSince: '2025',
    bookedServices: 'XYX',
    location: 'Jamshedpur, Jharkhand',
    email: 'aman.kumar2@example.com',
    phone: '+91 9876543212',
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    userId: 'CM0362',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar3',
    name: 'Aman Kumar',
    userSince: '2021',
    bookedServices: 'XYZ',
    location: 'Kolkata, West Bengal',
    email: 'aman.kumar3@example.com',
    phone: '+91 9876543213',
    status: 'banned',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '5',
    userId: 'AD0343',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BadalSingh2',
    name: 'Badal Singh',
    userSince: '2025',
    bookedServices: 'XYX',
    location: 'Jamshedpur, Jharkhand',
    email: 'badal.singh2@example.com',
    phone: '+91 9876543214',
    status: 'unverified-email',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '6',
    userId: 'AD8035',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanKumar4',
    name: 'Aman Kumar',
    userSince: '2021',
    bookedServices: 'XYZ',
    location: 'Kolkata, West Bengal',
    email: 'aman.kumar4@example.com',
    phone: '+91 9876543215',
    status: 'unverified-mobile',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock service functions
const getMockUsers = (status) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (status) {
        resolve(mockUsers.filter(user => {
          if (status === 'all-users') return true;
          if (status === 'active-users') return user.status === 'active';
          if (status === 'inactive-users') return user.status === 'inactive';
          if (status === 'banned-users') return user.status === 'banned';
          if (status === 'unverified-email') return user.status === 'unverified-email';
          if (status === 'unverified-mobile') return user.status === 'unverified-mobile';
          if (status === 'subscribers') return user.status === 'subscriber';
          return true;
        }));
      } else {
        resolve(mockUsers);
      }
    }, 500); // Simulate network delay
  });
};

const getMockUser = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u._id === id);
      resolve(user || null);
    }, 300);
  });
};

const createMockUser = (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = (mockUsers.length + 1).toString();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const newUser = {
        ...userData,
        _id: newId,
        userId: userData.userId || `AD${randomId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      resolve(newUser);
    }, 500);
  });
};

const updateMockUser = (id, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockUsers.findIndex(u => u._id === id);
      if (index === -1) {
        resolve(null);
        return;
      }
      mockUsers[index] = {
        ...mockUsers[index],
        ...data,
        updatedAt: new Date(),
      };
      resolve(mockUsers[index]);
    }, 500);
  });
};

const deleteMockUser = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initialLength = mockUsers.length;
      mockUsers = mockUsers.filter(u => u._id !== id);
      resolve(initialLength !== mockUsers.length);
    }, 500);
  });
};

module.exports = {
  getMockUsers,
  getMockUser,
  createMockUser,
  updateMockUser,
  deleteMockUser,
};