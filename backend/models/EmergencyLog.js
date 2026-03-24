const mongoose = require('mongoose');

const emergencyLogSchema = new mongoose.Schema({
  fechaEnvio: { type: Date, default: Date.now },
  studentRut: { type: String, required: true },
  studentName: { type: String, required: true },
  course: { type: String, required: true },
  guardianEmail: { type: String, required: true },
  templateKey: { type: String, required: true },
  templateLabel: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  atencion: { type: mongoose.Schema.Types.Mixed, default: {} },
  observations: { type: String, default: '' },
  sentBy: { type: String, required: true },
  status: { type: String, enum: ['enviado', 'error'], default: 'enviado' },
  error: { type: String, default: '' }
});

module.exports = mongoose.model('EmergencyLog', emergencyLogSchema);
