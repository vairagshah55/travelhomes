// Clean JS mock service for settings — all data as explicit object literals!

// In-memory mock SEO settings by page
const mockSeoSettings = {
  Homepage: {
    page: 'Homepage',
    metaTitle: 'Home | MySite',
    metaDescription: 'This is the home page description.',
    metaKeywords: 'booking, travel, home',
    faviconUrl: '/uploads/favicon.ico',
    logoUrl: '/uploads/logo.png',
    ogImageUrl: '/uploads/og.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
};

// In-memory mock System settings by userType
const mockSystemSettings = {
  Vendor: {
    _id: 'sys-vendor',
    userType: 'Vendor',
    taxRate: 18,
    currency: 'INR',
    companyName: 'Acme Travels',
    companyAddress: '123 Main Street',
    supportEmail: 'support@acme.com',
    supportPhone: '+91-1234567890',
    payoutBankName: 'ICICI',
    payoutAccount: '1234567890',
    payoutIFSC: 'ICIC0000001',
    termsUrl: 'https://example.com/terms',
    privacyUrl: 'https://example.com/privacy',
    cancellationPolicy: '24h prior for full refund',
    refundPolicy: 'Subject to terms',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  Admin: {
    _id: 'sys-admin',
    userType: 'Admin',
    // ... more admin settings as needed
    createdAt: new Date(),
    updatedAt: new Date(),
  }
};

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ---- SEO MOCKS ----
async function getMockSeo(page) {
  await delay(20);
  return (
    mockSeoSettings[page] ||
    { page, metaTitle: '', metaDescription: '', metaKeywords: '', createdAt: new Date(), updatedAt: new Date() }
  );
}
async function updateMockSeo(page, data) {
  await delay(50);
  if (!mockSeoSettings[page]) {
    mockSeoSettings[page] = { page, createdAt: new Date(), updatedAt: new Date() };
  }
  Object.assign(mockSeoSettings[page], data || {}, { updatedAt: new Date() });
  return mockSeoSettings[page];
}

// ---- SYSTEM MOCKS ----
async function getMockSystem(userType) {
  await delay(20);
  if (!mockSystemSettings[userType]) {
    mockSystemSettings[userType] = { userType, createdAt: new Date(), updatedAt: new Date() };
  }
  return mockSystemSettings[userType];
}
async function updateMockSystem(userType, data) {
  await delay(40);
  if (!mockSystemSettings[userType]) {
    mockSystemSettings[userType] = { userType, createdAt: new Date(), updatedAt: new Date() };
  }
  Object.assign(mockSystemSettings[userType], data || {}, { updatedAt: new Date() });
  return mockSystemSettings[userType];
}

module.exports = {
  getMockSeo,
  updateMockSeo,
  getMockSystem,
  updateMockSystem,
};