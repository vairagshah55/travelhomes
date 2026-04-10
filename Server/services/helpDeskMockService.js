/**
 * Mock data for development (pure JS, no types)
 */
let mockHelpDeskItems = [
  {
    _id: '1',
    vendorName: 'Badal Singh',
    companyName: 'ITC Town',
    subject: 'Lorem Ipsum Text',
    date: new Date('2024-03-12'),
    status: 'Pending',
    message:
      'The alignment of the primary CTA button on the homepage appears inconsistent across different screen sizes. On smaller screens, the button shifts slightly to the right, affecting the visual balance.',
    createdAt: new Date('2024-03-12T10:00:00'),
    updatedAt: new Date('2024-03-12T10:10:00'),
  },
  {
    _id: '2',
    vendorName: 'Badal Singh',
    companyName: 'ITC Town',
    subject: 'Lorem Ipsum Text',
    date: new Date('2024-03-12'),
    status: 'Resolved',
    message:
      'The alignment of the primary CTA button on the homepage appears inconsistent across different screen sizes. On smaller screens, the button shifts slightly to the right, affecting the visual balance.',
    createdAt: new Date('2024-03-12T11:00:00'),
    updatedAt: new Date('2024-03-12T12:00:00'),
  }
];

const getMockHelpDeskItems = (params = {}) => {
  const { status, search, sortBy = 'createdAt', sortDir = 'desc' } = params;
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...mockHelpDeskItems];
      if (status && status !== 'all') {
        list = list.filter(i => i.status === status);
      }
      if (search) {
        const term = search.trim().toLowerCase();
        list = list.filter(i =>
          [i.vendorName, i.companyName, i.subject]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(term))
        );
      }
      list.sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        let av, bv;
        if (sortBy === 'date') {
          av = new Date(a.date).getTime();
          bv = new Date(b.date).getTime();
        } else if (sortBy === 'status') {
          av = a.status;
          bv = b.status;
        } else {
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
        }
        if (av > bv) return 1 * dir;
        if (av < bv) return -1 * dir;
        return 0;
      });
      resolve(list);
    }, 300);
  });
};

const getMockHelpDeskItem = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const x = mockHelpDeskItems.find(i => i._id === id) || null;
      resolve(x);
    }, 200);
  });
};

const createMockHelpDeskItem = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = (mockHelpDeskItems.length + 1).toString();
      const item = {
        _id: newId,
        vendorName: data.vendorName || 'Unknown',
        companyName: data.companyName || 'Unknown',
        subject: data.subject || 'No Subject',
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status || 'Pending',
        message: data.message || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHelpDeskItems.push(item);
      resolve(item);
    }, 200);
  });
};

const updateMockHelpDeskItem = (id, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = mockHelpDeskItems.findIndex(i => i._id === id);
      if (idx === -1) return resolve(null);
      mockHelpDeskItems[idx] = { ...mockHelpDeskItems[idx], ...data, updatedAt: new Date() };
      resolve(mockHelpDeskItems[idx]);
    }, 200);
  });
};

const deleteMockHelpDeskItem = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initial = mockHelpDeskItems.length;
      mockHelpDeskItems = mockHelpDeskItems.filter(i => i._id !== id);
      resolve(initial !== mockHelpDeskItems.length);
    }, 200);
  });
};

const updateMockHelpDeskStatus = (id, status) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = mockHelpDeskItems.findIndex(i => i._id === id);
      if (idx === -1) return resolve(null);
      mockHelpDeskItems[idx] = { ...mockHelpDeskItems[idx], status, updatedAt: new Date() };
      resolve(mockHelpDeskItems[idx]);
    }, 200);
  });
};

module.exports = {
  getMockHelpDeskItems,
  getMockHelpDeskItem,
  createMockHelpDeskItem,
  updateMockHelpDeskItem,
  deleteMockHelpDeskItem,
  updateMockHelpDeskStatus
};