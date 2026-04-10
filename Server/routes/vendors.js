const express = require('express');
const {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
  checkVendorStatus,
} = require('../controller/vendorController');
const { requireJwt } = require('../middleware/auth');
const router = express.Router();

router.get('/check', requireJwt(), checkVendorStatus);

router.route('/')
  .get(getVendors)
  .post(createVendor);

router.route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(deleteVendor);

router.patch('/:id/status', updateVendorStatus);

module.exports = router;