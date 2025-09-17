const mongoose = require('mongoose');

const TimelineEventSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  type: { type: String, enum: ['admission', 'scholarship', 'entrance_test', 'counseling'] },
  title: String,
  startDate: Date,
  endDate: Date,
  description: String
});

module.exports = mongoose.model('TimelineEvent', TimelineEventSchema);
