const Trip = require('../models/Trip');

// Create a new trip
const createTrip = async (req, res) => {
  try {
    const { tripId, userId, destination, startDate, endDate, status } = req.body;
    
    if (!tripId || !userId || !destination || !startDate || !endDate || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: tripId, userId, destination, startDate, endDate, status' 
      });
    }

    const exists = await Trip.findOne({ tripId });
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Trip with this ID already exists' 
      });
    }

    const trip = new Trip({
      tripId,
      userId,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
    });

    await trip.save();
    return res.status(201).json({ 
      success: true, 
      data: trip,
      message: 'Trip created successfully' 
    });
  } catch (error) {
    console.error('createTrip error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all trips
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ startDate: -1 });
    return res.status(200).json({ 
      success: true, 
      data: trips 
    });
  } catch (error) {
    console.error('getTrips error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get trips starting today
const getTodayTrips = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const trips = await Trip.find({
      startDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ startDate: 1 });

    return res.status(200).json({ 
      success: true, 
      data: trips 
    });
  } catch (error) {
    console.error('getTodayTrips error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get trips ending this week
const getThisWeekEndingTrips = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6, 23, 59, 59);

    const trips = await Trip.find({
      endDate: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    }).sort({ endDate: 1 });

    return res.status(200).json({ 
      success: true, 
      data: trips 
    });
  } catch (error) {
    console.error('getThisWeekEndingTrips error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTodayTrips,
  getThisWeekEndingTrips
};