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
    googleMapsLink: String, // Direct Google Maps URL
    mapEmbedUrl: String     // Embeddable map URL
  },
  programs: [ProgramSchema],
  facilities: [String],
  contact: {
    phone: String,
    email: String,
    website: String
  }
});

module.exports = mongoose.model('College', CollegeSchema);
