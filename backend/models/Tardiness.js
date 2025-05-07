// models/Tardiness.js
const mongoose = require('mongoose');

const tardinessSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  hora: { type: String, required: true },
  motivo: { type: String, required: true },
  studentRut: { type: String, required: true }, // Se relaciona con el RUT del estudiante
  curso: { type: String, required: true }
});

module.exports = mongoose.model('Tardiness', tardinessSchema);
