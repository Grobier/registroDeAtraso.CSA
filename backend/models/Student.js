// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rut: { type: String, unique: true, required: true },
  nombres: { type: String, required: true },
  apellidosPaterno: { type: String, required: true },
  apellidosMaterno: { type: String, required: true },
  curso: { type: String, required: true },
  correoApoderado: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ['activo', 'egresado', 'retirado'], 
    default: 'activo' 
  },
  añoEgreso: { type: Number },
  fechaEgreso: { type: Date },
  repite: { 
    type: Boolean, 
    default: false 
  },
  motivoRepitencia: { 
    type: String,
    enum: ['académico', 'asistencia', 'otro'],
    default: 'académico'
  }
});

module.exports = mongoose.model('Student', studentSchema);
