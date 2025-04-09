// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rut: { type: String, unique: true, required: true },
  nombres: { type: String, required: true },
  apellidosPaterno: { type: String, required: true },
  apellidosMaterno: { type: String, required: true },
  curso: { type: String, required: true },
  correoApoderado: { type: String, required: true },
});

module.exports = mongoose.model('Student', studentSchema);
