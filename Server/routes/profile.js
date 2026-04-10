const express = require('express');
const { getProfile, upsertProfile, upload, uploadProfilePhoto } = require('../controller/profileController');
const router = express.Router();

// GET by query or param
router.get('/', getProfile); // /api/profile?email=
router.get('/:email', getProfile); // /api/profile/:email

// Upsert
router.put('/', upsertProfile);

// Upload profile photo
router.post('/photo', upload.single('photo'), uploadProfilePhoto);

module.exports = router;