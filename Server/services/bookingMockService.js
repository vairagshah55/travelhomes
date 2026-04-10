/**
 * Mock booking data and service functions for development. 
 * Provides asynchronous Promise-based functions for CRUD on bookings.
 */

let mockBookings = [
  {
    _id: '1',
    bookingId: 'BK1001',
    guestName: 'John Doe',
    date: '2025-09-03',
    extraItems: [{ name: 'Extra Bed', price: 25, quantity: 2 }],
    paymentDetails: { amount: 350, method: 'card', paid: true },
    billDeskInfo: { txnId: 'TXN123456', status: 'Success' },
    notes: 'Prefer window seat',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    bookingId: 'BK1002',
    guestName: 'Jane Smith',
    date: '2025-09-02',
    extraItems: [],
    paymentDetails: { amount: 200, method: 'cash', paid: false },
    billDeskInfo: {},
    notes: '',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Return all bookings (optionally filtered by status, but no in-file filter)
function getMockBookings(_status) {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockBookings]), 200);
  });
}

// Get a booking by its _id
function getMockBooking(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const booking = mockBookings.find(b => b._id === id);
      resolve(booking || null);
    }, 150);
  });
}

// Create a new mock booking
function createMockBooking(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = (mockBookings.length + 1).toString();
      const newBooking = {
        _id: newId,
        bookingId: data.bookingId || `BK${1000 + +newId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'pending',
        ...data,
      };
      mockBookings.push(newBooking);
      resolve(newBooking);
    }, 300);
  });
}

// Update a booking by _id
function updateMockBooking(id, update) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = mockBookings.findIndex(b => b._id === id);
      if (idx === -1) return resolve(null);
      mockBookings[idx] = {
        ...mockBookings[idx],
        ...update,
        updatedAt: new Date()
      };
      resolve(mockBookings[idx]);
    }, 250);
  });
}

// Delete a booking by _id
function deleteMockBooking(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initialLength = mockBookings.length;
      mockBookings = mockBookings.filter(b => b._id !== id);
      resolve(initialLength !== mockBookings.length);
    }, 200);
  });
}

module.exports = {
  getMockBookings,
  getMockBooking,
  createMockBooking,
  updateMockBooking,
  deleteMockBooking,
};