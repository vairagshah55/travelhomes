/**
 * Mock CRM message functions for development (no database required)
 * Avoid all TypeScript, use plain JavaScript only
 */

let store = [];

const mockCreate = async (payload) => {
  const doc = {
    _id: Date.now().toString() + Math.random().toString(16).slice(2),
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.unshift(doc);
  return doc;
};

const mockList = async (filter = {}) => {
  return store.filter(m =>
    (!filter.targetType || m.targetType === filter.targetType) &&
    (!filter.commType || m.commType === filter.commType)
  );
};

const mockDelete = async (id) => {
  const before = store.length;
  store = store.filter(m => m._id !== id);
  return store.length < before;
};

module.exports = {
  mockCreate,
  mockList,
  mockDelete
};