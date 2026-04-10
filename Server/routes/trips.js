const { Router } = require('express');
const { createTrip, getTrips, getTodayTrips, getThisWeekEndingTrips } = require('../controller/tripController');
const router = Router();
// POST /api/trips - Create a new trip
router.post('/trips', createTrip);
// GET /api/trips - Get all trips
router.get('/trips', getTrips);
// GET /api/trips/today - Get today's starting trips
router.get('/trips/today', getTodayTrips);
// GET /api/trips/this-week - Get trips ending this week
router.get('/trips/this-week', getThisWeekEndingTrips);
module.exports = router;