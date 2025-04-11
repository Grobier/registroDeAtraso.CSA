// backend/models/Session.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    // Ejemplo: 1 día de duración
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
});

module.exports = mongoose.model('Session', sessionSchema);
