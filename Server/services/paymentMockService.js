let mockPayments = [
  {
    _id: '1',
    paymentId: 'CV042W4',
    businessName: 'ITC Town',
    personName: 'Badal Singh',
    servicesId: 'SA24O22',
    servicesNames: 'XYZ',
    status: 'pending',
    amount: '₹6000',
    paymentMode: 'Gpay',
    transactionId: 'badal@gpay846492',
    serviceCategory: 'canper-van',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    paymentId: 'CV042W5',
    businessName: 'ITC Town',
    personName: 'Aman Kumar',
    servicesId: 'SA24O23',
    servicesNames: 'XYZ',
    status: 'paid',
    amount: '₹4500',
    paymentMode: 'UPI',
    transactionId: 'aman@upi2345',
    serviceCategory: 'unique-stay',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    paymentId: 'CV042W6',
    businessName: 'TAJ Renue',
    personName: 'Sunil Kumar',
    servicesId: 'SA24O24',
    servicesNames: 'ABC',
    status: 'requested',
    amount: '₹12000',
    paymentMode: 'Card',
    transactionId: 'TXN12345',
    serviceCategory: 'activity',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    paymentId: 'CV042W7',
    businessName: 'Royal ITC',
    personName: 'Ravi Singh',
    servicesId: 'SA24O25',
    servicesNames: 'DEF',
    status: 'processing',
    amount: '₹3500',
    paymentMode: 'Gpay',
    transactionId: 'ravi@gpay123',
    serviceCategory: 'canper-van',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '5',
    paymentId: 'CV042W8',
    businessName: 'TAJ Renue',
    personName: 'Kunal Shah',
    servicesId: 'SA24O26',
    servicesNames: 'GHI',
    status: 'refunded',
    amount: '₹8000',
    paymentMode: 'NetBanking',
    transactionId: 'NBK998877',
    serviceCategory: 'unique-stay',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

function matchesTab(p, tab) {
  if (!tab) return true;
  if (tab === 'payment-received') return true; // show all by default
  if (tab === 'vendor') return p.status === 'paid' || p.status === 'pending';
  if (tab === 'refund-status') return ['refunded', 'processing', 'requested'].includes(p.status);
  return true;
}

function matchesServiceType(p, tab, serviceType) {
  if (!serviceType) return true;
  if (tab === 'payment-received') {
    return p.serviceCategory === serviceType;
  }
  if (tab === 'vendor' || tab === 'refund-status') {
    if (serviceType === 'pending') return p.status === 'pending' || p.status === 'processing' || p.status === 'requested';
    if (serviceType === 'paid') return p.status === 'paid' || p.status === 'refunded';
  }
  return true;
}

function matchesSearch(p, term) {
  if (!term) return true;
  const t = term.trim().toLowerCase();
  return [
    p.paymentId,
    p.businessName,
    p.personName,
    p.servicesId,
    p.servicesNames,
    p.transactionId || '',
  ].some((v) => String(v || '').toLowerCase().includes(t));
}

function sortList(list, sortBy, sortDir) {
  if (!sortBy) return list;
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const av = (a?.[sortBy] ?? '').toString().toLowerCase();
    const bv = (b?.[sortBy] ?? '').toString().toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

const getMockPayments = (params) => {
  const { tab, serviceType, search, sortBy, sortDir } = params || {};
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = mockPayments.filter((p) => matchesTab(p, tab))
        .filter((p) => matchesServiceType(p, tab, serviceType))
        .filter((p) => matchesSearch(p, search));
      list = sortList(list, sortBy, sortDir);
      resolve(list);
    }, 300);
  });
};

const getMockPayment = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPayments.find((x) => x._id === id) || null);
    }, 200);
  });
};

const createMockPayment = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = (mockPayments.length + 1).toString();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const payment = {
        ...data,
        _id: newId,
        paymentId: data.paymentId || `PM${randomId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'pending',
      };
      mockPayments.push(payment);
      resolve(payment);
    }, 300);
  });
};

const updateMockPayment = (id, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = mockPayments.findIndex((x) => x._id === id);
      if (idx === -1) return resolve(null);
      mockPayments[idx] = { ...mockPayments[idx], ...data, updatedAt: new Date() };
      resolve(mockPayments[idx]);
    }, 300);
  });
};

const deleteMockPayment = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initial = mockPayments.length;
      mockPayments = mockPayments.filter((x) => x._id !== id);
      resolve(initial !== mockPayments.length);
    }, 300);
  });
};

module.exports = {
  getMockPayments,
  getMockPayment,
  createMockPayment,
  updateMockPayment,
  deleteMockPayment
};