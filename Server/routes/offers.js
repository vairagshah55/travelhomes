const express = require('express');
const {
  createOffer,
  listOffers,
  getOffer,
  updateOffer,
  deleteOffer,
  updateOfferStatus,
  rateOffer
} = require('../controller/offerController');
const { requireJwt } = require('../middleware/auth');
const router = express.Router();

// List all offers or filter by status/sort
router.get('/', requireJwt({ optional: true }), listOffers); 
// Create a new offer
router.post('/', requireJwt(), createOffer); 
// Get offer by id
router.get('/:id', getOffer); 
// Update offer by id
router.put('/:id', requireJwt(), updateOffer); 
// Delete offer by id
router.delete('/:id', requireJwt(), deleteOffer); 
// Update offer status
router.patch('/:id/status', requireJwt(), updateOfferStatus); 
// Rate offer by id
router.post('/:id/rate', requireJwt(), rateOffer); 

module.exports = router;