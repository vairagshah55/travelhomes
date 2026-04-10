const express = require('express');
const { sendMessage, listMessages, deleteMessage } = require('../controller/adminCrmController');
const router = express.Router();

// Send a message (POST)
router.post('/send', sendMessage);

// List all messages (GET)
router.get('/messages', listMessages);

// Delete a message by ID (DELETE)
router.delete('/messages/:id', deleteMessage);

module.exports = router;