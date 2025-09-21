const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Admin = require('../models/Admin');
const auth = require('basic-auth');
const xlsx = require('xlsx');

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
  const credentials = auth(req);
  
  if (!credentials) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Unauthorized - Admin credentials required' });
  }

  try {
    // First, try to find admin in database
    const admin = await Admin.findOne({ username: credentials.name });
    
    if (admin) {
      // Check database credentials
      const isMatch = await admin.comparePassword(credentials.pass);
      if (isMatch) {
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        req.adminUser = admin;
        return next();
      }
    }
    
    // Fallback to environment variables (default credentials)
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (credentials.name === defaultUsername && credentials.pass === defaultPassword) {
      req.adminUser = { username: defaultUsername, isDefault: true };
      return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Invalid credentials' });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication failed' });
  }
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

// GET /colleges/export (admin only) - Export colleges to Excel
router.get('/export', adminAuth, async (req, res) => {
  try {
    const colleges = await College.find({}, 'name district address contact.phone contact.email programs.name');
    
    // Prepare data for Excel
    const excelData = colleges.map(college => ({
      'College ID': college._id,
      'College Name': college.name,
      'District': college.district,
      'Address': college.address,
      'Phone': college.contact?.phone || '',
      'Email': college.contact?.email || '',
      'Programs': college.programs.map(p => p.name).join(', '),
      'Total Programs': college.programs.length
    }));

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const columnWidths = [
      { wch: 25 }, // College ID
      { wch: 40 }, // College Name
      { wch: 15 }, // District
      { wch: 50 }, // Address
      { wch: 15 }, // Phone
      { wch: 30 }, // Email
      { wch: 60 }, // Programs
      { wch: 15 }  // Total Programs
    ];
    worksheet['!cols'] = columnWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Colleges');
    
    // Generate Excel file buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=colleges-export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(excelBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /colleges/:id (admin only)
router.get('/:id', adminAuth, async (req, res) => {
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

// PUT /colleges/:id (admin only) - Update college by ID
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json(college);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /colleges/:id (admin only) - Delete college by ID
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json({ message: 'College deleted successfully', college });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /colleges/change-admin-credentials (admin only) - Change admin credentials
router.post('/change-admin-credentials', adminAuth, async (req, res) => {
  try {
    const { newUsername, newPassword } = req.body;
    
    if (!newUsername || !newPassword) {
      return res.status(400).json({ error: 'Both newUsername and newPassword are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if admin already exists in database
    let admin = await Admin.findOne({ username: req.adminUser.username });
    
    if (admin) {
      // Update existing admin
      admin.username = newUsername;
      admin.password = newPassword;
      admin.isDefault = false;
      await admin.save();
    } else {
      // Create new admin (transitioning from default credentials)
      admin = new Admin({
        username: newUsername,
        password: newPassword,
        isDefault: false
      });
      await admin.save();
    }
    
    res.json({ 
      message: 'Admin credentials updated successfully',
      newUsername: newUsername,
      note: 'Please use the new credentials for future requests. Default .env credentials are now inactive.'
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// GET /colleges/admin-info (admin only) - Get current admin info
router.get('/admin-info', adminAuth, async (req, res) => {
  try {
    res.json({
      username: req.adminUser.username,
      isDefault: req.adminUser.isDefault || false,
      lastLogin: req.adminUser.lastLogin || null,
      message: req.adminUser.isDefault ? 'Using default credentials from .env' : 'Using database credentials'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
