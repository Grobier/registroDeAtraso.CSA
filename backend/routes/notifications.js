// routes/notifications.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Tardiness = require('../models/Tardiness');
const EmailLog = require('../models/EmailLog');
const { sendEmail } = require('../config/emailConfig');
const { ensureAuthenticated } = require('../middlewares/auth');

// Obtener estudiantes con atrasos ordenados por cantidad
router.get('/students-with-tardiness', ensureAuthenticated, async (req, res) => {
  try {
    // Obtener todos los estudiantes
    const allStudents = await Student.find();
    
    // Para cada estudiante, obtener sus atrasos usando consulta directa
    const studentsWithTardiness = await Promise.all(
      allStudents.map(async (student) => {
        // Obtener atrasos del estudiante usando consulta directa
        const atrasos = await Tardiness.find({ studentRut: student.rut }).sort({ fecha: -1 });
        
        if (atrasos.length > 0) {
          // Contar certificados adjuntos
          const totalCertificados = atrasos.filter(a => a.certificadoAdjunto && a.certificadoAdjunto !== null).length;
          
          // Log para debugging
          console.log(`Estudiante ${student.rut}: ${atrasos.length} atrasos, ${totalCertificados} certificados`);
          
          return {
            rut: student.rut,
            nombres: student.nombres,
            apellidosPaterno: student.apellidosPaterno,
            apellidosMaterno: student.apellidosMaterno,
            curso: student.curso,
            correoApoderado: student.correoApoderado,
            totalAtrasos: atrasos.length, // Usar consulta directa para consistencia
            totalCertificados: totalCertificados, // Agregar conteo de certificados
            atrasos: atrasos.map(a => ({
              fecha: a.fecha,
              hora: a.hora,
              motivo: a.motivo,
              concepto: a.concepto || 'atrasado', // Incluir el concepto del atraso
              trajoCertificado: a.trajoCertificado || false,
              certificadoAdjunto: a.certificadoAdjunto || null // Incluir el nombre del archivo adjunto
            }))
          };
        }
        return null;
      })
    );

    // Filtrar estudiantes válidos (con atrasos) y ordenar por cantidad
    const validStudents = studentsWithTardiness
      .filter(student => student !== null)
      .sort((a, b) => b.totalAtrasos - a.totalAtrasos);

    console.log(`Total de estudiantes con atrasos: ${validStudents.length}`);
    console.log(`Estudiante con más atrasos: ${validStudents[0]?.rut} (${validStudents[0]?.totalAtrasos} atrasos)`);

    res.json(validStudents);
  } catch (error) {
    console.error('Error al obtener estudiantes con atrasos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estudiantes con atrasos filtrados por mes
router.get('/students-with-tardiness-by-month', ensureAuthenticated, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Mes y año son requeridos' });
    }

    // Crear fechas de inicio y fin del mes
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Obtener todos los estudiantes
    const allStudents = await Student.find();
    
    // Para cada estudiante, obtener sus atrasos del mes específico usando consulta directa
    const studentsWithTardiness = await Promise.all(
      allStudents.map(async (student) => {
        // Obtener atrasos del estudiante en el mes específico usando consulta directa
        const atrasos = await Tardiness.find({ 
          studentRut: student.rut,
          fecha: {
            $gte: startDate,
            $lte: endDate
          }
        }).sort({ fecha: -1 });
        
        if (atrasos.length > 0) {
          // Contar certificados adjuntos
          const totalCertificados = atrasos.filter(a => a.certificadoAdjunto && a.certificadoAdjunto !== null).length;
          
          return {
            rut: student.rut,
            nombres: student.nombres,
            apellidosPaterno: student.apellidosPaterno,
            apellidosMaterno: student.apellidosMaterno,
            curso: student.curso,
            correoApoderado: student.correoApoderado,
            totalAtrasos: atrasos.length, // Usar consulta directa para consistencia
            totalCertificados: totalCertificados, // Agregar conteo de certificados
            atrasos: atrasos.map(a => ({
              fecha: a.fecha,
              hora: a.hora,
              motivo: a.motivo,
              concepto: a.concepto || 'atrasado',
              trajoCertificado: a.trajoCertificado || false,
              certificadoAdjunto: a.certificadoAdjunto || null
            }))
          };
        }
        return null;
      })
    );

    // Filtrar estudiantes válidos (con atrasos en el mes) y ordenar por cantidad
    const validStudents = studentsWithTardiness
      .filter(student => student !== null)
      .sort((a, b) => b.totalAtrasos - a.totalAtrasos);

    res.json(validStudents);
  } catch (error) {
    console.error('Error al obtener estudiantes con atrasos por mes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estudiantes con atrasos filtrados por rango de fechas
router.get('/students-with-tardiness-by-date', ensureAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('🔍 FILTRO DE FECHAS - BACKEND:');
    console.log('📅 startDate recibido:', startDate);
    console.log('📅 endDate recibido:', endDate);
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Fecha de inicio y fin son requeridas' });
    }

    // Crear fechas de inicio y fin con zona horaria de Chile
    const start = new Date(startDate + 'T00:00:00.000-03:00'); // Chile timezone
    const end = new Date(endDate + 'T23:59:59.999-03:00'); // Chile timezone
    
    console.log('🕐 Fecha inicio procesada:', start);
    console.log('🕐 Fecha inicio UTC:', start.toISOString());
    console.log('🕐 Fecha fin procesada:', end);
    console.log('🕐 Fecha fin UTC:', end.toISOString());

    // Obtener todos los estudiantes
    const allStudents = await Student.find();
    
    // Para cada estudiante, obtener sus atrasos en el rango de fechas usando consulta directa
    const studentsWithTardiness = await Promise.all(
      allStudents.map(async (student) => {
        // Obtener atrasos del estudiante en el rango de fechas usando consulta directa
        const atrasos = await Tardiness.find({ 
          studentRut: student.rut,
          fecha: {
            $gte: start,
            $lte: end
          }
        }).sort({ fecha: -1 });
        
        if (atrasos.length > 0) {
          // Contar certificados adjuntos
          const totalCertificados = atrasos.filter(a => a.certificadoAdjunto && a.certificadoAdjunto !== null).length;
          
          return {
            rut: student.rut,
            nombres: student.nombres,
            apellidosPaterno: student.apellidosPaterno,
            apellidosMaterno: student.apellidosMaterno,
            curso: student.curso,
            correoApoderado: student.correoApoderado,
            totalAtrasos: atrasos.length, // Usar consulta directa para consistencia
            totalCertificados: totalCertificados, // Agregar conteo de certificados
            atrasos: atrasos.map(a => ({
              fecha: a.fecha,
              hora: a.hora,
              motivo: a.motivo,
              concepto: a.concepto || 'atrasado',
              trajoCertificado: a.trajoCertificado || false,
              certificadoAdjunto: a.certificadoAdjunto || null
            }))
          };
        }
        return null;
      })
    );

    // Filtrar estudiantes válidos (con atrasos en el rango) y ordenar por cantidad
    const validStudents = studentsWithTardiness
      .filter(student => student !== null)
      .sort((a, b) => b.totalAtrasos - a.totalAtrasos);

    console.log('📊 RESULTADOS DE LA CONSULTA:');
    console.log('👥 Total de estudiantes con atrasos en el período:', validStudents.length);
    
    // Mostrar algunos ejemplos de los atrasos encontrados
    validStudents.slice(0, 3).forEach(student => {
      console.log(`📋 ${student.nombres} (${student.rut}): ${student.totalAtrasos} atrasos`);
      if (student.atrasos && student.atrasos.length > 0) {
        console.log('   📅 Fechas:', student.atrasos.map(a => a.fecha).slice(0, 2));
      }
    });

    // DEBUG: Mostrar todas las fechas únicas en la base de datos
    const allTardiness = await Tardiness.find({}).select('fecha studentRut').limit(20).sort({ fecha: -1 });
    console.log('🔍 FECHAS REALES EN LA BASE DE DATOS (últimas 20):');
    allTardiness.forEach(t => {
      console.log('   📅', t.fecha, '- RUT:', t.studentRut);
    });

    // DEBUG: Verificar si hay atrasos específicamente en el rango solicitado
    const tardinessInRange = await Tardiness.find({
      fecha: {
        $gte: start,
        $lte: end
      }
    }).select('fecha studentRut').limit(10);
    
    console.log('🎯 ATRASOS ENCONTRADOS EN EL RANGO SOLICITADO:');
    console.log(`   📅 Rango: ${start.toISOString()} a ${end.toISOString()}`);
    console.log(`   📊 Total encontrados: ${tardinessInRange.length}`);
    tardinessInRange.forEach(t => {
      console.log('   ✅', t.fecha, '- RUT:', t.studentRut);
    });

    res.json(validStudents);
  } catch (error) {
    console.error('Error al obtener estudiantes con atrasos por rango de fechas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Enviar correos a los apoderados
router.post('/send-emails', ensureAuthenticated, async (req, res) => {
  try {
    const { asunto, contenido, estudiantesSeleccionados } = req.body;
    const user = req.user;

    if (!asunto || !contenido || !estudiantesSeleccionados || estudiantesSeleccionados.length === 0) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Obtener información de los estudiantes seleccionados
    const students = await Student.find({ rut: { $in: estudiantesSeleccionados } });
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No se encontraron estudiantes' });
    }

    // Preparar correos para enviar
    const emailsToSend = [];
    const totalAtrasos = estudiantesSeleccionados.length;

    console.log(`=== RESUMEN DE ENVÍO DE CORREOS ===`);
    console.log(`Estudiantes seleccionados: ${estudiantesSeleccionados.length}`);
    console.log(`RUTs: ${estudiantesSeleccionados.join(', ')}`);

    for (const student of students) {
      // Obtener atrasos específicos del estudiante
      const atrasos = await Tardiness.find({ studentRut: student.rut }).sort({ fecha: -1 });
      
      // Log para debugging - verificar consistencia
      console.log(`Enviando correo a ${student.rut}: ${atrasos.length} atrasos encontrados para correo`);
      
      // Crear contenido personalizado para cada estudiante
      const contenidoPersonalizado = contenido
        .replace('{NOMBRE_ESTUDIANTE}', `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`)
        .replace('{CURSO}', student.curso)
        .replace('{TOTAL_ATRASOS}', atrasos.length)
        .replace('{DETALLE_ATRASOS}', atrasos.map(a => 
          `- ${new Date(a.fecha).toLocaleDateString('es-CL')} a las ${a.hora}: ${a.motivo}`
        ).join('\n'));

      emailsToSend.push({
        to: student.correoApoderado,
        subject: asunto,
        content: contenidoPersonalizado,
        studentRut: student.rut
      });
    }

    // Enviar correos
    const sentEmails = [];
    const failedEmails = [];

    for (const email of emailsToSend) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'tu-email@gmail.com',
          to: email.to,
          subject: email.subject,
          html: email.content.replace(/\n/g, '<br>')
        };

        await sendEmail(mailOptions);
        sentEmails.push(email.to);
      } catch (error) {
        console.error(`Error enviando correo a ${email.to}:`, error);
        failedEmails.push({ email: email.to, error: error.message });
      }
    }

    // Registrar en el log
    const emailLog = new EmailLog({
      destinatarios: sentEmails,
      asunto,
      contenido,
      estudiantesIncluidos: estudiantesSeleccionados,
      totalAtrasos,
      enviadoPor: user.username || user.email,
      estado: failedEmails.length > 0 ? 'error' : 'enviado',
      error: failedEmails.length > 0 ? JSON.stringify(failedEmails) : undefined
    });

    await emailLog.save();

    console.log(`=== RESUMEN FINAL ===`);
    console.log(`Correos enviados: ${sentEmails.length}`);
    console.log(`Correos fallidos: ${failedEmails.length}`);
    console.log(`Total de atrasos procesados: ${totalAtrasos}`);

    res.json({
      message: 'Correos enviados correctamente',
      enviados: sentEmails.length,
      fallidos: failedEmails.length,
      detalles: {
        exitosos: sentEmails,
        fallidos: failedEmails
      }
    });

  } catch (error) {
    console.error('Error al enviar correos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener historial de correos enviados
router.get('/email-history', ensureAuthenticated, async (req, res) => {
  try {
    const emailLogs = await EmailLog.find().sort({ fechaEnvio: -1 }).limit(50);
    res.json(emailLogs);
  } catch (error) {
    console.error('Error al obtener historial de correos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
