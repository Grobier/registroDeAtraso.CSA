// Script para crear un estudiante de prueba
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Tardiness = require('./models/Tardiness');

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atraso';

async function createTestStudent() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Datos del estudiante de prueba
    const testStudent = {
      rut: 'TEST001',
      nombres: 'Estudiante',
      apellidosPaterno: 'De',
      apellidosMaterno: 'Prueba',
      curso: '1°A',
      correoApoderado: 'tu-email@gmail.com' // CAMBIAR POR TU CORREO REAL
    };

    // Verificar si ya existe
    const existingStudent = await Student.findOne({ rut: testStudent.rut });
    if (existingStudent) {
      console.log('⚠️ El estudiante de prueba ya existe');
      console.log('Datos actuales:', existingStudent);
      
      // Actualizar el correo si es necesario
      if (existingStudent.correoApoderado !== testStudent.correoApoderado) {
        existingStudent.correoApoderado = testStudent.correoApoderado;
        await existingStudent.save();
        console.log('✅ Correo del apoderado actualizado');
      }
    } else {
      // Crear nuevo estudiante
      const newStudent = new Student(testStudent);
      await newStudent.save();
      console.log('✅ Estudiante de prueba creado exitosamente');
      console.log('Datos:', newStudent);
    }

    // Crear algunos atrasos de prueba para este estudiante
    const testTardiness = [
      {
        fecha: new Date('2024-12-01'),
        hora: '08:30',
        motivo: 'Llegada tarde a clases',
        studentRut: testStudent.rut,
        curso: testStudent.curso
      },
      {
        fecha: new Date('2024-12-05'),
        hora: '08:45',
        motivo: 'Retraso en transporte',
        studentRut: testStudent.rut,
        curso: testStudent.curso
      },
      {
        fecha: new Date('2024-12-10'),
        hora: '09:15',
        motivo: 'Problemas de salud',
        studentRut: testStudent.rut,
        curso: testStudent.curso
      }
    ];

    // Verificar si ya existen atrasos
    const existingTardiness = await Tardiness.find({ studentRut: testStudent.rut });
    if (existingTardiness.length === 0) {
      // Crear atrasos de prueba
      for (const tardiness of testTardiness) {
        const newTardiness = new Tardiness(tardiness);
        await newTardiness.save();
      }
      console.log('✅ Atrasos de prueba creados exitosamente');
    } else {
      console.log(`⚠️ Ya existen ${existingTardiness.length} atrasos para el estudiante de prueba`);
    }

    console.log('\n🎯 RESUMEN DE PRUEBA:');
    console.log('• Estudiante:', testStudent.nombres, testStudent.apellidosPaterno, testStudent.apellidosMaterno);
    console.log('• RUT:', testStudent.rut);
    console.log('• Curso:', testStudent.curso);
    console.log('• Correo apoderado:', testStudent.correoApoderado);
    console.log('• Total atrasos:', testTardiness.length);
    
    console.log('\n💡 INSTRUCCIONES PARA PRUEBAS:');
    console.log('1. Ve a la página de Notificaciones');
    console.log('2. Busca el estudiante "TEST001" o "Estudiante De Prueba"');
    console.log('3. Selecciona SOLO este estudiante');
    console.log('4. Envía un correo de prueba');
    console.log('5. Verifica que solo llegue a tu correo');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
createTestStudent();
