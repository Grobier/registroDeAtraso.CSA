// Script para migrar conceptos de atrasos existentes
// Integra la lógica del certificado médico con los conceptos
const mongoose = require('mongoose');
const Tardiness = require('./models/Tardiness');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI;

async function migrateTardinessConcepts() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los registros de atrasos
    const allTardiness = await Tardiness.find({});
    console.log(`📊 Total de registros de atrasos encontrados: ${allTardiness.length}`);

    if (allTardiness.length === 0) {
      console.log('ℹ️ No hay registros de atrasos para migrar');
      return;
    }

    let updatedCount = 0;
    let presentCount = 0;
    let atrasadoPresenteCount = 0;
    let ausenteCount = 0;

    console.log('\n🔄 Procesando registros existentes...');

    // Procesar cada registro
    for (const tardiness of allTardiness) {
      const hora = tardiness.hora;
      const [horas, minutos] = hora.split(':').map(Number);
      const horaEnMinutos = horas * 60 + minutos;
      const limiteMinutos = 9 * 60 + 30; // 9:30 AM

      let nuevoConcepto = 'presente';
      let requiereCertificado = false;
      let trajoCertificado = false;

      // Verificar si el registro tiene información de certificado
      if (tardiness.trajoCertificado !== undefined) {
        trajoCertificado = tardiness.trajoCertificado;
      } else {
        // Si no tiene el campo, asumir que NO trajo certificado (registros antiguos)
        trajoCertificado = false;
        console.log(`⚠️ Registro ${tardiness._id} no tiene campo trajoCertificado, asumiendo false`);
      }

      if (horaEnMinutos <= limiteMinutos) {
        // Hasta 9:30 AM → presente (con o sin certificado)
        nuevoConcepto = 'presente';
        requiereCertificado = false;
        presentCount++;
        
        console.log(`🟢 ${hora} → presente (antes de 9:30 AM)`);
      } else {
        // Después de 9:30 AM
        if (trajoCertificado) {
          // Con certificado → atrasado-presente
          nuevoConcepto = 'atrasado-presente';
          requiereCertificado = true;
          atrasadoPresenteCount++;
          
          console.log(`🟡 ${hora} → atrasado-presente (después de 9:30 AM + con certificado)`);
        } else {
          // Sin certificado → ausente
          nuevoConcepto = 'ausente';
          requiereCertificado = true;
          ausenteCount++;
          
          console.log(`🔴 ${hora} → ausente (después de 9:30 AM + sin certificado)`);
        }
      }

      // Actualizar el registro con los nuevos campos
      const updateData = {
        concepto: nuevoConcepto,
        requiereCertificado: requiereCertificado
      };

      // Si no tiene el campo trajoCertificado, agregarlo
      if (tardiness.trajoCertificado === undefined) {
        updateData.trajoCertificado = trajoCertificado;
      }

      // Actualizar el registro
      await Tardiness.updateOne(
        { _id: tardiness._id },
        updateData
      );
      
      updatedCount++;
    }

    console.log('\n🎯 RESUMEN DE MIGRACIÓN:');
    console.log(`• Total de registros procesados: ${allTardiness.length}`);
    console.log(`• Registros actualizados: ${updatedCount}`);
    console.log(`• Concepto "presente": ${presentCount} 🟢`);
    console.log(`• Concepto "atrasado-presente": ${atrasadoPresenteCount} 🟡`);
    console.log(`• Concepto "ausente": ${ausenteCount} 🔴`);

    console.log('\n📋 EJEMPLOS DE CONCEPTOS:');
    console.log('• 08:43, 08:46, 08:48, 08:52, 08:55, 08:59 → presente (verde)');
    console.log('• 09:01, 09:02, 09:12, 09:26, 11:33 → ausente (rojo) - sin certificado');
    console.log('• Si algún registro tuviera certificado después de 9:30 AM → atrasado-presente (amarillo)');

    console.log('\n✅ Migración completada exitosamente');
    console.log('💡 Ahora los conceptos se mostrarán correctamente en el frontend');
    console.log('🔄 Reinicia el backend para que los cambios tomen efecto');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar la migración
migrateTardinessConcepts();
