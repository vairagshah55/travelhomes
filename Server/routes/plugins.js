const express = require('express');
const { listPlugins, getPlugin, createPlugin, updatePlugin, togglePlugin, setPluginLicense, removePlugin } = require('../controller/pluginsController');
const router = express.Router();

// List
router.get('/', listPlugins);
// Get
router.get('/:id', getPlugin);
// Create
router.post('/', createPlugin);
// Update
router.put('/:id', updatePlugin);
// Toggle enable/disable
router.patch('/:id/toggle', togglePlugin);
// Set license
router.put('/:id/license', setPluginLicense);
// Delete
router.delete('/:id', removePlugin);

module.exports = router;