// models/EmailLog.js
const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  fechaEnvio: { type: Date, default: Date.now },
  destinatarios: [{ type: String }], // Array de emails de apoderados
  asunto: { type: String, required: true },
  contenido: { type: String, required: true },
  estudiantesIncluidos: [{ type: String }], // Array de RUTs de estudiantes
  totalAtrasos: { type: Number, required: true },
  enviadoPor: { type: String, required: true }, // Usuario que envió el correo
  estado: { type: String, enum: ['enviado', 'error'], default: 'enviado' },
  error: { type: String } // Mensaje de error si falla
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
