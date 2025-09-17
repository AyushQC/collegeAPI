const express = require('express');
const router = express.Router();
const College = require('../models/College');

// Admin token middleware
const adminAuth = (req, res, next) => {
  const adminToken = process.env.ADMIN_TOKEN;
  const reqToken = req.header('x-admin-token');
  if (!reqToken || reqToken !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// GET /colleges?district=DistrictName
router.get('/', async (req, res) => {
  try {
    const filter = req.query.district ? { district: req.query.district } : {};
    const colleges = await College.find(filter);
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /colleges/:id
router.get('/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ error: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /colleges (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();
    res.status(201).json(college);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
