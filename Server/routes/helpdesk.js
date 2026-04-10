// HelpDesk Routes - Clean pure JS, robust migration
const express = require('express');
const {
  getHelpDeskItems,
  getHelpDeskItem,
  createHelpDeskItem,
  updateHelpDeskItem,
  deleteHelpDeskItem,
  updateHelpDeskStatus,
} = require('../controller/helpDeskController');

const router = express.Router();

// List & create help desk tickets
router.route('/')
  .get(getHelpDeskItems)
  .post(createHelpDeskItem);

// Get, update, delete by ID
router.route('/:id')
  .get(getHelpDeskItem)
  .put(updateHelpDeskItem)
  .delete(deleteHelpDeskItem);

// Update status of a ticket
router.patch('/:id/status', updateHelpDeskStatus);

module.exports = router;