const express = require('express');
const router = express.Router();
const TimelineEvent = require('../models/TimelineEvent');

// GET /timeline?district=DistrictName
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.district) {
      filter = { ...filter, district: req.query.district };
    }
    const events = await TimelineEvent.find(filter).populate('collegeId');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /colleges/:id/timeline
router.get('/college/:collegeId', async (req, res) => {
  try {
    const events = await TimelineEvent.find({ collegeId: req.params.collegeId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /timeline (for adding events)
router.post('/', async (req, res) => {
  try {
    const event = new TimelineEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
