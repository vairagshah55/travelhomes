// Demo route - robust pure JS. No TS alias, safe for CommonJS+Express.

const express = require('express');
const router = express.Router();

// GET /demo -- simple health/test/demo endpoint
router.get('/', (req, res) => {
  res.json({ message: "Hello from Express server" });
});

module.exports = router;
