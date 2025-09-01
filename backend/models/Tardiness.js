// models/Tardiness.js
const mongoose = require('mongoose');

const tardinessSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  hora: { type: String, required: true },
  motivo: { type: String, required: true },
  studentRut: { type: String, required: true }, // Se relaciona con el RUT del estudiante
  curso: { type: String, required: true },
  // Nuevos campos para certificado médico
  trajoCertificado: { type: Boolean, default: false },
  certificadoAdjunto: { type: String }, // URL o path del archivo
           concepto: { type: String, enum: ['presente', 'atrasado-presente', 'ausente'], default: 'presente' },
  // Campo para validar si es obligatorio el certificado
  requiereCertificado: { type: Boolean, default: true }
});

module.exports = mongoose.model('Tardiness', tardinessSchema);
