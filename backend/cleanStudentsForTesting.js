// Script para limpiar estudiantes y dejar solo el de prueba
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Tardiness = require('./models/Tardiness');

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atraso';

async function cleanStudentsForTesting() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los estudiantes
    const allStudents = await Student.find();
    console.log(`📊 Total de estudiantes encontrados: ${allStudents.length}`);

    if (allStudents.length === 0) {
      console.log('ℹ️ No hay estudiantes para limpiar');
      return;
    }

    // Mostrar estudiantes que se van a eliminar
    console.log('\n🗑️ Estudiantes que se eliminarán:');
    allStudents.forEach(student => {
      if (student.rut !== 'TEST001') {
        console.log(`• ${student.rut} - ${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`);
      }
    });

    // Confirmar antes de eliminar
    console.log('\n⚠️ ADVERTENCIA: Esta acción eliminará TODOS los estudiantes excepto TEST001');
    console.log('¿Estás seguro de que quieres continuar? (Ctrl+C para cancelar)');
    
    // Esperar 5 segundos para dar tiempo de cancelar
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Eliminar estudiantes (excepto TEST001)
    const studentsToDelete = allStudents.filter(student => student.rut !== 'TEST001');
    
    if (studentsToDelete.length > 0) {
      // Eliminar atrasos de estos estudiantes primero
      for (const student of studentsToDelete) {
        await Tardiness.deleteMany({ studentRut: student.rut });
        console.log(`🗑️ Atrasos eliminados para ${student.rut}`);
      }

      // Eliminar estudiantes
      await Student.deleteMany({ rut: { $ne: 'TEST001' } });
      console.log(`✅ ${studentsToDelete.length} estudiantes eliminados`);
    }

    // Verificar que solo queda el estudiante de prueba
    const remainingStudents = await Student.find();
    console.log(`\n✅ Estudiantes restantes: ${remainingStudents.length}`);
    
    if (remainingStudents.length > 0) {
      console.log('📋 Detalles del estudiante de prueba:');
      remainingStudents.forEach(student => {
        console.log(`• RUT: ${student.rut}`);
        console.log(`• Nombre: ${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`);
        console.log(`• Curso: ${student.curso}`);
        console.log(`• Correo apoderado: ${student.correoApoderado}`);
      });
    }

    // Verificar atrasos restantes
    const remainingTardiness = await Tardiness.find();
    console.log(`\n📊 Total de atrasos restantes: ${remainingTardiness.length}`);

    console.log('\n🎯 AMBIENTE DE PRUEBA LISTO:');
    console.log('• Solo queda el estudiante TEST001');
    console.log('• Puedes hacer pruebas seguras sin enviar correos a apoderados reales');
    console.log('• Para restaurar datos, usa tu backup de la base de datos');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
cleanStudentsForTesting();
