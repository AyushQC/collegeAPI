const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  name: String,
  cutoff: Number,
  eligibility: String,
  medium: String
});

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: String,
  address: String,
  location: {
    lat: Number,
    lng: Number
  },
  programs: [ProgramSchema],
  facilities: [String],
  contact: {
    phone: String,
    email: String
  }
});

module.exports = mongoose.model('College', CollegeSchema);
