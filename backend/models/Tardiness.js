// models/Tardiness.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const tardinessSchema = new Schema({
  fecha: { type: Date, default: Date.now },
  hora: { type: String, required: true },
  motivo: { type: String, required: true },
  studentRut: { type: String, required: true }, // Se relaciona con el RUT del estudiante
  curso: { type: String, required: true },
  reportedBy:{ type: Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Tardiness', tardinessSchema);
