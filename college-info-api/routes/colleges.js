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

// GET /colleges?district=DistrictName&program=ProgramName
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.district) {
      filter.district = req.query.district;
    }
    if (req.query.program) {
      filter.programs = { $elemMatch: { name: { $regex: req.query.program, $options: 'i' } } };
    }
    const colleges = await College.find(filter);
    // If filtering by program, only return matching programs in each college
    if (req.query.program) {
      const programRegex = new RegExp(req.query.program, 'i');
      const filteredColleges = colleges.map(college => {
        const matchingPrograms = college.programs.filter(p => programRegex.test(p.name));
        return {
          ...college.toObject(),
          programs: matchingPrograms
        };
      }).filter(college => college.programs.length > 0);
      return res.json(filteredColleges);
    }
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
