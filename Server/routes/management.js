const express = require('express');
const {
  getManagementListings,
  getManagementListing,
  createManagementListing,
  updateManagementListing,
  deleteManagementListing,
  updateListingStatus,
} = require('../controller/managementController');

const router = express.Router();

// Collection routes
router.route('/')
  .get(getManagementListings)
  .post(createManagementListing);

// Item routes
router.route('/:id')
  .get(getManagementListing)
  .put(updateManagementListing)
  .delete(deleteManagementListing);

// Status update on item
router.route('/:id/status')
  .patch(updateListingStatus);

module.exports = router;