const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Puede ser el username, email o userId
  action: { type: String, required: true },
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema); 