const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tardiness = require('../models/Tardiness');
const Student = require('../models/Student');
const EmailLog = require('../models/EmailLog');
const moment = require('moment-timezone');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, verifyEmailConnection } = require('../config/emailConfig');
require('dotenv').config();
const { ensureAuthenticated } = require('../middlewares/auth');

// Utilidades de RUT
const normalizeRut = (rut) => rut?.toString()?.toLowerCase()?.replace(/[.\-]/g, '')?.trim();

const buildRutFlexibleRegex = (normalizedRut) => {
  const escaped = normalizedRut
    .split('')
    .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[.\\-]?');
  return new RegExp(`^${escaped}$`, 'i');
};

const sanitizeEmail = (email) => email?.toString()?.trim()?.toLowerCase();
const emailSender = process.env.RESEND_FROM || process.env.EMAIL_FROM || process.env.EMAIL_USER;

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/certificados');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG, DOC y DOCX.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

console.log('🔧 Iniciando verificación de conexión SMTP...');
console.log('🔧 EMAIL_USER configurado:', !!process.env.EMAIL_USER);
console.log('🔧 EMAIL_PASS configurado:', !!process.env.EMAIL_PASS);

verifyEmailConnection()
  .then((success) => {
    console.log('✅ Verificación SMTP exitosa:', success);
  })
  .catch((error) => {
    console.error('❌ Error en verificación inicial de email:', error);
    console.error('❌ Stack trace:', error.stack);
  });

const cleanRut = (rut) => rut.toString().trim().replace(/\s+/g, '');

router.post('/', ensureAuthenticated, upload.single('certificadoAdjunto'), async (req, res) => {
  console.log('\n=== INTENTANDO REGISTRAR ATRASO ===');
  console.log('Usuario autenticado:', req.user);
  console.log('Session ID:', req.sessionID);
  console.log('req.isAuthenticated():', req.isAuthenticated());
  console.log('Body recibido:', req.body);

  try {
    const { motivo, rut, curso, trajoCertificado, horaManual, fechaManual } = req.body;
    const trajo = ['true', '1', 'on', true, 1, 'True', 'TRUE'].includes(trajoCertificado);
    const certificadoAdjunto = req.file ? req.file.filename : null;

    const searchRut = normalizeRut(rut);

    if (!motivo || !rut || !curso) {
      return res.status(400).json({ error: 'Campos requeridos: motivo, rut y curso.' });
    }

    let horaRegistro;
    let horaRegistroHour;
    let horaRegistroMinute;
    let fechaRegistro;

    if (horaManual) {
      horaRegistro = horaManual;
      const [hours, minutes] = horaManual.split(':').map(Number);
      horaRegistroHour = hours;
      horaRegistroMinute = minutes;
    } else {
      horaRegistro = moment().tz('America/Santiago').format('HH:mm');
      horaRegistroHour = moment().tz('America/Santiago').hour();
      horaRegistroMinute = moment().tz('America/Santiago').minute();
    }

    if (fechaManual) {
      const fechaHoraManual = moment.tz(
        `${fechaManual} ${horaRegistro}`,
        'YYYY-MM-DD HH:mm',
        'America/Santiago'
      );
      fechaRegistro = fechaHoraManual.isValid()
        ? fechaHoraManual.toDate()
        : moment().tz('America/Santiago').toDate();
    } else {
      fechaRegistro = moment().tz('America/Santiago').toDate();
    }

    let concepto = 'presente';
    let requiereCertificado = false;

    const minutosDesdeMedianoche = horaRegistroHour * 60 + horaRegistroMinute;
    const limiteMinutos = 9 * 60 + 30;

    if (minutosDesdeMedianoche <= limiteMinutos) {
      concepto = 'presente';
      requiereCertificado = false;
    } else if (trajo) {
      concepto = 'atrasado-presente';
      requiereCertificado = true;
    } else {
      concepto = 'ausente';
      requiereCertificado = true;
    }

    const newTardiness = new Tardiness({
      fecha: fechaRegistro,
      hora: horaRegistro,
      motivo,
      studentRut: searchRut,
      curso,
      trajoCertificado: !!trajo,
      certificadoAdjunto: certificadoAdjunto || null,
      concepto,
      requiereCertificado
    });

    await newTardiness.save();

    const performedBy = req.user && req.user.username ? req.user.username : 'Desconocido';

    await ActivityLog.create({
      user: performedBy,
      action: 'Registrar atraso',
      details: `Atraso registrado para RUT: ${rut}, curso: ${curso}, concepto: ${concepto}, certificado: ${trajoCertificado ? 'Sí' : 'No'}`
    });

    let student = await Student.findOne({ rut: { $regex: buildRutFlexibleRegex(searchRut) } });

    if (!student) {
      const rutSinGuion = searchRut.replace(/[-\dkK]/g, '');
      student = await Student.findOne({
        $or: [
          { rut: { $regex: new RegExp(`^${rutSinGuion}`, 'i') } },
          { rut: { $regex: new RegExp(`${rutSinGuion}`, 'i') } }
        ]
      });
    }

    if (!student) {
      student = await Student.findOne({
        rut: { $regex: new RegExp(searchRut.replace(/[-\dkK]/g, ''), 'i') }
      });
    }

    const responseData = {
      message: `Atraso registrado como ${concepto}`,
      concepto,
      requiereCertificado,
      trajoCertificado: !!trajo,
      emailSent: false,
      emailError: null
    };

    if (student) {
      const guardianEmail = sanitizeEmail(student.correoApoderado);

      if (guardianEmail) {
        const nombreCompleto = `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`;
        const fechaFormateada = moment(newTardiness.fecha).tz('America/Santiago').format('DD/MM/YYYY');
        const horaFormateada = horaRegistro;
        const mailOptions = {
          from: emailSender,
          to: guardianEmail,
          subject: 'Notificación de atraso',
          text:
            `Estimado(a) apoderado(a) de ${nombreCompleto}:

Le informamos que el/la estudiante ${nombreCompleto} registró un atraso el día ${fechaFormateada}, ingresando al establecimiento a las ${horaFormateada}.
Motivo del atraso: ${motivo}

Le recordamos que la puntualidad es fundamental para favorecer el proceso de aprendizaje y que este registro será considerado en la revisión mensual, según lo establecido en nuestro Manual de Convivencia Escolar, el cual puede revisar en:
https://www.colegiosaintarieli.cl/normativa/reglamentos-internos

Agradecemos su atención y compromiso.

Atentamente,
Equipo directivo.`
        };

        try {
          const mailInfo = await sendEmail(mailOptions, 20000);
          console.log('Correo enviado:', mailInfo.messageId);
          responseData.message += ' y correo enviado al apoderado';
          responseData.emailSent = true;

          await EmailLog.create({
            destinatarios: [guardianEmail],
            asunto: mailOptions.subject,
            contenido: mailOptions.text,
            estudiantesIncluidos: [student.rut],
            totalAtrasos: 1,
            enviadoPor: performedBy,
            estado: 'enviado'
          });
        } catch (mailError) {
          console.error('Error al enviar correo:', mailError.message);
          responseData.message += ' (atraso registrado, pero el correo falló)';
          responseData.emailError = mailError.message || 'No fue posible enviar el correo al apoderado';

          await EmailLog.create({
            destinatarios: [guardianEmail],
            asunto: mailOptions.subject,
            contenido: mailOptions.text,
            estudiantesIncluidos: [student.rut],
            totalAtrasos: 1,
            enviadoPor: performedBy,
            estado: 'error',
            error: responseData.emailError
          });
        }
      } else {
        responseData.message += ' (correo no enviado - sin correo configurado)';
        responseData.emailError = 'No hay correo configurado para el apoderado';
      }
    } else {
      responseData.message += ' (correo no enviado - estudiante no encontrado)';
      responseData.emailError = 'No se encontró el estudiante asociado al atraso';
    }

    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Error completo:', error);

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
      }
      return res.status(400).json({ error: `Error en la subida del archivo: ${error.message}` });
    }

    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const yearFilter = { fecha: { $gte: startOfYear, $lt: endOfYear } };

    const [statsByDay, statsByCourse, statsByStudent, allTardiness] = await Promise.all([
      Tardiness.aggregate([
        { $match: yearFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$fecha',
                timezone: 'America/Santiago'
              }
            },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      Tardiness.aggregate([
        { $match: yearFilter },
        {
          $group: {
            _id: '$curso',
            total: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),
      Tardiness.aggregate([
        { $match: yearFilter },
        {
          $group: {
            _id: '$studentRut',
            total: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),
      Tardiness.find(yearFilter).sort({ fecha: -1 }).limit(1000)
    ]);

    res.json({
      statsByDay,
      statsByCourse,
      statsByStudent,
      allTardiness,
      year
    });
  } catch (error) {
    console.error('Error en estadísticas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/debug/dates', async (req, res) => {
  try {
    const allDates = await Tardiness.distinct('fecha');
    const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));

    const today = new Date();
    const todayChile = new Date(today.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
    const todayStr = todayChile.toISOString().split('T')[0];

    res.json({
      fechaActual: todayStr,
      fechaActualCompleta: todayChile.toISOString(),
      totalFechas: allDates.length,
      ultimas10Fechas: sortedDates.slice(0, 10),
      hoyExiste: sortedDates.some((date) => new Date(date).toISOString().split('T')[0] === todayStr)
    });
  } catch (error) {
    console.error('Error en debug/dates:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/statistics/today', async (req, res) => {
  try {
    const today = new Date();
    const todayChile = new Date(today.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
    const todayStr = todayChile.toISOString().split('T')[0];

    const allDates = await Tardiness.distinct('fecha');
    const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));

    const startOfDayChile = moment.tz(`${todayStr} 00:00:00`, 'YYYY-MM-DD HH:mm:ss', 'America/Santiago').toDate();
    const endOfDayChile = moment.tz(`${todayStr} 23:59:59.999`, 'YYYY-MM-DD HH:mm:ss.SSS', 'America/Santiago').toDate();

    const todayTardiness = await Tardiness.find({
      fecha: {
        $gte: startOfDayChile,
        $lte: endOfDayChile
      }
    }).sort({ fecha: -1 });

    const uniqueStudents = new Map();
    todayTardiness.forEach((record) => {
      if (!uniqueStudents.has(record.studentRut)) {
        uniqueStudents.set(record.studentRut, record);
      }
    });

    const uniqueTodayTardiness = Array.from(uniqueStudents.values());

    const stats = {
      total: uniqueTodayTardiness.length,
      totalRecords: todayTardiness.length,
      withCertificate: uniqueTodayTardiness.filter((r) => r.trajoCertificado).length,
      withoutCertificate: uniqueTodayTardiness.filter((r) => !r.trajoCertificado).length,
      present: uniqueTodayTardiness.filter((r) => r.concepto === 'presente').length,
      latePresent: uniqueTodayTardiness.filter((r) => r.concepto === 'atrasado-presente').length,
      absent: uniqueTodayTardiness.filter((r) => r.concepto === 'ausente').length,
      byCourse: {},
      byHour: {}
    };

    uniqueTodayTardiness.forEach((record) => {
      if (!stats.byCourse[record.curso]) {
        stats.byCourse[record.curso] = 0;
      }
      stats.byCourse[record.curso] += 1;
    });

    uniqueTodayTardiness.forEach((record) => {
      const hour = record.hora.split(':')[0];
      if (!stats.byHour[hour]) {
        stats.byHour[hour] = 0;
      }
      stats.byHour[hour] += 1;
    });

    res.json({
      date: todayStr,
      stats,
      tardiness: uniqueTodayTardiness,
      totalRecords: todayTardiness.length,
      uniqueStudents: uniqueTodayTardiness.length,
      availableDates: sortedDates.slice(0, 10)
    });
  } catch (error) {
    console.error('Error en estadísticas del día:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/statistics/week', async (req, res) => {
  try {
    const now = moment.tz('America/Santiago');
    const startOfWeek = now.clone().startOf('isoWeek').toDate();
    const endOfWeek = now.clone().endOf('isoWeek').toDate();

    const weekTardiness = await Tardiness.find({
      fecha: { $gte: startOfWeek, $lte: endOfWeek }
    }).sort({ fecha: -1 });

    const uniqueStudents = new Set(weekTardiness.map((r) => r.studentRut));

    const stats = {
      total: uniqueStudents.size,
      totalRecords: weekTardiness.length
    };

    res.json({
      range: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString()
      },
      stats,
      tardiness: weekTardiness
    });
  } catch (error) {
    console.error('Error en estadísticas de la semana:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/statistics/month', async (req, res) => {
  try {
    const now = moment.tz('America/Santiago');
    const startOfMonth = now.clone().startOf('month').toDate();
    const endOfMonth = now.clone().endOf('month').toDate();

    const monthTardiness = await Tardiness.find({
      fecha: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ fecha: -1 });

    const uniqueStudents = new Set(monthTardiness.map((r) => r.studentRut));

    const stats = {
      total: uniqueStudents.size,
      totalRecords: monthTardiness.length
    };

    res.json({
      range: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString()
      },
      stats,
      tardiness: monthTardiness
    });
  } catch (error) {
    console.error('Error en estadísticas del mes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/monthly-report', async (req, res) => {
  try {
    const { month, year } = req.query;

    const reportData = await Tardiness.find({
      fecha: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      }
    });

    const students = await Student.find();

    for (const student of students) {
      const studentAtrasos = reportData.filter((a) => a.studentRut == student.rut);

      if (studentAtrasos.length > 0) {
        const nombreCompleto = `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`;

        let reporteTexto = `Reporte mensual de atrasos para ${nombreCompleto}:\n\n`;
        studentAtrasos.forEach((a) => {
          reporteTexto += `Fecha: ${a.fecha.toLocaleDateString()}, Hora: ${a.hora}, Motivo: ${a.motivo}\n`;
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.correoApoderado,
          subject: 'Reporte Mensual de Atrasos',
          text: reporteTexto
        };

        try {
          const info = await sendEmail(mailOptions);
          console.log('Reporte mensual enviado:', info.response);
        } catch (error) {
          console.error('Error al enviar reporte mensual:', error);
        }
      }
    }

    res.json({ message: 'Reportes enviados' });
  } catch (error) {
    console.error('Error en reporte mensual:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/', async (req, res) => {
  try {
    const tardiness = await Tardiness.find().sort({ fecha: -1 });
    res.json(tardiness);
  } catch (error) {
    console.error('Error al obtener atrasos:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/certificado/:filename', ensureAuthenticated, (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = path.resolve(__dirname, '../uploads/certificados');
    const filePath = path.resolve(uploadsDir, filename);

    // Verificar que el archivo resuelto esté dentro de la carpeta permitida
    if (!filePath.startsWith(uploadsDir + path.sep)) {
      return res.status(400).json({ error: 'Nombre de archivo no válido' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Error al descargar certificado:', error);
    res.status(500).json({ error: 'Error al descargar el archivo' });
  }
});

// Eliminar un atraso por ID (solo admin)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const deleted = await Tardiness.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    await ActivityLog.create({
      user: req.user.username,
      action: 'Eliminar atraso',
      details: `Atraso eliminado: RUT ${deleted.studentRut}, fecha ${deleted.fecha}`
    });
    res.json({ message: 'Atraso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar atraso:', error);
    res.status(500).json({ error: 'Error al eliminar el atraso' });
  }
});

module.exports = router;
