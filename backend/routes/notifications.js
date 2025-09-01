// routes/notifications.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Student = require('../models/Student');
const Tardiness = require('../models/Tardiness');
const EmailLog = require('../models/EmailLog');
const { ensureAuthenticated } = require('../middlewares/auth');

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tu-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu-app-password'
  }
});

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
          // Log para debugging
          console.log(`Estudiante ${student.rut}: ${atrasos.length} atrasos encontrados`);
          
          return {
            rut: student.rut,
            nombres: student.nombres,
            apellidosPaterno: student.apellidosPaterno,
            apellidosMaterno: student.apellidosMaterno,
            curso: student.curso,
            correoApoderado: student.correoApoderado,
            totalAtrasos: atrasos.length, // Usar consulta directa para consistencia
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
          return {
            rut: student.rut,
            nombres: student.nombres,
            apellidosPaterno: student.apellidosPaterno,
            apellidosMaterno: student.apellidosMaterno,
            curso: student.curso,
            correoApoderado: student.correoApoderado,
            totalAtrasos: atrasos.length, // Usar consulta directa para consistencia
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
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Fecha de inicio y fin son requeridas' });
    }

    // Crear fechas de inicio y fin
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir todo el día final

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
          return {
            rut: student.rut,
            nombres: student.nombres,
            apellidosPaterno: student.apellidosPaterno,
            apellidosMaterno: student.apellidosMaterno,
            curso: student.curso,
            correoApoderado: student.correoApoderado,
            totalAtrasos: atrasos.length, // Usar consulta directa para consistencia
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

        await transporter.sendMail(mailOptions);
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
