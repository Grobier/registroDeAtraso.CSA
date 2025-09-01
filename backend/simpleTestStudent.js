// Script simple para crear estudiante de prueba
const mongoose = require('mongoose');
const Student = require('./models/Student');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atraso';

async function createSimpleTestStudent() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Crear estudiante de prueba
    const testStudent = new Student({
      rut: 'TEST001',
      nombres: 'Estudiante',
      apellidosPaterno: 'De',
      apellidosMaterno: 'Prueba',
      curso: '1°A',
      correoApoderado: 'tu-email@gmail.com' // CAMBIAR POR TU CORREO
    });

    await testStudent.save();
    console.log('✅ Estudiante de prueba creado:', testStudent.rut);

  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️ El estudiante TEST001 ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await mongoose.connection.close();
  }
}

createSimpleTestStudent();
