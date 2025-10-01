// routes/tardiness.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tardiness = require('../models/Tardiness');
const Student = require('../models/Student');
const moment = require('moment-timezone');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, verifyEmailConnection } = require('../config/emailConfig');
require('dotenv').config();
const { ensureAuthenticated } = require('../middlewares/auth');

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/certificados');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: timestamp + nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Permitir solo ciertos tipos de archivo
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG, DOC y DOCX.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Verificar la conexión SMTP al iniciar el servidor
console.log("🔧 Iniciando verificación de conexión SMTP...");
console.log("🔧 EMAIL_USER configurado:", !!process.env.EMAIL_USER);
console.log("🔧 EMAIL_PASS configurado:", !!process.env.EMAIL_PASS);

verifyEmailConnection().then(success => {
  console.log("✅ Verificación SMTP exitosa:", success);
}).catch(error => {
  console.error("❌ Error en verificación inicial de email:", error);
  console.error("❌ Stack trace:", error.stack);
});

// Función para limpiar completamente el RUT
const cleanRut = (rut) => {
  return rut.toString().trim().replace(/\s+/g, '');
};

// 1. Registrar un atraso (la hora se asigna automáticamente)
router.post('/', ensureAuthenticated, upload.single('certificadoAdjunto'), async (req, res) => {
  console.log('\n=== INTENTANDO REGISTRAR ATRASO ===');
  console.log('Usuario autenticado:', req.user);
  console.log('Session ID:', req.sessionID);
  console.log('req.isAuthenticated():', req.isAuthenticated());
  console.log('Body recibido:', req.body);
  
  try {
    const { motivo, rut, curso, trajoCertificado, horaManual } = req.body;
    const certificadoAdjunto = req.file ? req.file.filename : null;
    
    console.log("\n=== DATOS RECIBIDOS ===");
    console.log("Motivo:", motivo);
    console.log("RUT recibido:", rut);
    console.log("Curso:", curso);
    console.log("Trajo certificado:", trajoCertificado);
    console.log("Hora manual:", horaManual);
    console.log("Certificado adjunto:", certificadoAdjunto);
    
    // Limpiamos el RUT completamente
    const searchRut = cleanRut(rut);
    
    console.log("\n=== DIAGNÓSTICO DE RUT ===");
    console.log("RUT original:", rut);
    console.log("RUT limpio:", searchRut);
    console.log("Longitud RUT:", searchRut.length);
    console.log("Códigos ASCII:", [...searchRut].map(c => c.charCodeAt(0)));

    if (!motivo || !rut || !curso) {
      return res.status(400).json({ error: "Campos requeridos: motivo, rut y curso." });
    }

    // Determinar la hora a usar: manual si se proporciona, actual si no
    let horaRegistro, horaRegistroHour, horaRegistroMinute;
    
    if (horaManual) {
      // Usar la hora manual proporcionada
      console.log("🕐 Usando hora manual:", horaManual);
      horaRegistro = horaManual;
      
      // Parsear la hora manual (formato HH:mm)
      const [hours, minutes] = horaManual.split(':').map(Number);
      horaRegistroHour = hours;
      horaRegistroMinute = minutes;
    } else {
      // Usar la hora actual del servidor
      console.log("🕐 Usando hora actual del servidor");
      horaRegistro = moment().tz('America/Santiago').format('HH:mm');
      horaRegistroHour = moment().tz('America/Santiago').hour();
      horaRegistroMinute = moment().tz('America/Santiago').minute();
    }
    
    console.log("🕐 Hora final a registrar:", horaRegistro);
    console.log("🕐 Hora (número):", horaRegistroHour);
    console.log("🕐 Minutos (número):", horaRegistroMinute);
    
         // Lógica para determinar concepto y si requiere certificado
     let concepto = 'presente';
     let requiereCertificado = false;
     
     // Si llega antes o a las 9:30 (9 horas y 30 minutos = 9*60 + 30 = 570 minutos)
     const minutosDesdeMedianoche = horaRegistroHour * 60 + horaRegistroMinute;
     const limiteMinutos = 9 * 60 + 30; // 9:30 AM
     
     if (minutosDesdeMedianoche <= limiteMinutos) {
       // Hasta 9:30 AM → presente (con o sin certificado)
       concepto = 'presente';
       requiereCertificado = false;
     } else {
       // Después de 9:30 AM
       if (trajoCertificado) {
         // Con certificado → atrasado-presente
         concepto = 'atrasado-presente';
         requiereCertificado = true;
       } else {
         // Sin certificado → ausente
         concepto = 'ausente';
         requiereCertificado = true;
       }
       
       // Validar que si es después de 9:30 AM, debe traer certificado
       if (!trajoCertificado) {
         return res.status(400).json({ 
           error: "Después de las 9:30 AM es obligatorio presentar certificado médico para justificar el atraso." 
         });
       }
     }

    // Guardar el registro de atraso en Tardiness
    const newTardiness = new Tardiness({ 
      hora: horaRegistro,
      motivo,
      studentRut: searchRut,
      curso,
      trajoCertificado: trajoCertificado || false,
      certificadoAdjunto: certificadoAdjunto || null,
      concepto,
      requiereCertificado
    });
    await newTardiness.save();
    console.log("Registro de atraso guardado:", newTardiness);

    // Registrar actividad
    let performedBy = (req.user && req.user.username) ? req.user.username : 'Desconocido';
    await ActivityLog.create({
      user: performedBy,
      action: 'Registrar atraso',
      details: `Atraso registrado para RUT: ${rut}, curso: ${curso}, concepto: ${concepto}, certificado: ${trajoCertificado ? 'Sí' : 'No'}`
    });

    // Log 2: Buscar todos los estudiantes para verificar
    const todosLosEstudiantes = await Student.find({});
    console.log("\n=== ESTUDIANTES EN LA BASE DE DATOS ===");
    console.log("Número total de estudiantes:", todosLosEstudiantes.length);
    console.log("Lista de RUTs en la BD:", todosLosEstudiantes.map(s => ({
      rut: s.rut,
      tipo: typeof s.rut
    })));

    // Buscar el estudiante con múltiples estrategias de búsqueda
    let student = await Student.findOne({
      $or: [
        { rut: searchRut },
        { rut: { $regex: new RegExp(`^${searchRut}$`, 'i') } }
      ]
    });

    // Si no se encuentra, intentar búsquedas más flexibles
    if (!student) {
      console.log("🔍 Primera búsqueda falló, intentando búsquedas alternativas...");
      
      // Buscar por RUT sin guión ni dígito verificador
      const rutSinGuion = searchRut.replace(/[-\dkK]/g, '');
      console.log("🔍 Buscando RUT sin guión:", rutSinGuion);
      
      student = await Student.findOne({
        $or: [
          { rut: { $regex: new RegExp(`^${rutSinGuion}`, 'i') } },
          { rut: { $regex: new RegExp(`${rutSinGuion}`, 'i') } }
        ]
      });
    }

    // Si aún no se encuentra, buscar por coincidencia parcial
    if (!student) {
      console.log("🔍 Segunda búsqueda falló, intentando coincidencia parcial...");
      
      student = await Student.findOne({
        rut: { $regex: new RegExp(searchRut.replace(/[-\dkK]/g, ''), 'i') }
      });
    }
    console.log("\n=== RESULTADO DE BÚSQUEDA ===");
    console.log("Estudiante encontrado:", student ? "SÍ" : "NO");
    
    if (student) {
      console.log("✅ Estudiante encontrado exitosamente!");
      console.log("Datos del estudiante encontrado:", {
        rut: student.rut,
        nombres: student.nombres,
        curso: student.curso,
        correoApoderado: student.correoApoderado
      });
      console.log("📧 Correo del apoderado:", student.correoApoderado);
      console.log("📧 Tipo de correo:", typeof student.correoApoderado);
      console.log("📧 Longitud del correo:", student.correoApoderado?.length);
      
      // Validar que el estudiante tenga correo del apoderado
      if (!student.correoApoderado || student.correoApoderado.trim() === '') {
        console.log("⚠️ El estudiante no tiene correo del apoderado configurado");
        console.log("Datos del estudiante:", {
          rut: student.rut,
          nombres: student.nombres,
          correoApoderado: student.correoApoderado
        });
      } else {
        const nombreCompleto = `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`;

        // Formatear la fecha y hora con la zona horaria correcta
        const fechaFormateada = moment(newTardiness.fecha).tz('America/Santiago').format('DD/MM/YYYY');
        const horaFormateada = horaRegistro; // Usar la hora registrada (manual o actual)

        // Opciones del correo
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.correoApoderado,
          subject: 'Notificación de Atraso',
          text: `Estimado(a) apoderado(a) de ${nombreCompleto},:

Le informamos que el/la estudiante ${nombreCompleto} registró un atraso el día ${fechaFormateada}, 
ingresando al establecimiento a las ${horaFormateada}.

Motivo del atraso: ${motivo}

Le recordamos que la puntualidad es fundamental para favorecer el proceso de
aprendizaje y que este registro será considerado en la revisión mensual, según lo
establecido en nuestro Manual de Convivencia Escolar, el cual puede revisar en:
https://www.colegiosaintarieli.cl/normativa/reglamentos-internos.
Agradecemos su atención y compromiso.

Atentamente,

Equipo directivo.`
        };

        console.log("📧 Preparando envío de correo a:", student.correoApoderado);
        console.log("📧 Asunto:", mailOptions.subject);
        console.log("📧 Variables de entorno EMAIL_USER:", process.env.EMAIL_USER ? "Configurado" : "NO CONFIGURADO");
        console.log("📧 Variables de entorno EMAIL_PASS:", process.env.EMAIL_PASS ? "Configurado" : "NO CONFIGURADO");
        console.log("📧 NODE_ENV:", process.env.NODE_ENV);
        console.log("📧 mailOptions completo:", JSON.stringify(mailOptions, null, 2));

        // Test de la función sendEmail
        console.log("🧪 Probando función sendEmail...");
        console.log("🧪 Tipo de sendEmail:", typeof sendEmail);
        console.log("🧪 sendEmail es función:", typeof sendEmail === 'function');
        
        // Enviar correo de forma asíncrona (no bloquea la respuesta)
        sendEmail(mailOptions).then(mailInfo => {
          console.log("✅ Correo enviado exitosamente:", mailInfo.messageId);
          console.log("✅ Respuesta completa:", mailInfo);
        }).catch(mailError => {
          console.error("❌ Error al enviar correo:", mailError);
          console.error("❌ Detalles del error:", {
            code: mailError.code,
            command: mailError.command,
            response: mailError.response,
            message: mailError.message,
            stack: mailError.stack
          });
        });
      }
    } else {
      console.log("⚠️ No se encontró el estudiante. Comparación de RUTs:");
      console.log("RUT buscado:", searchRut);
      const estudianteSimilar = todosLosEstudiantes.find(s => s.rut.includes(searchRut) || searchRut.includes(s.rut));
      if (estudianteSimilar) {
        console.log("Se encontró un RUT similar:", estudianteSimilar.rut);
      }
    }

    res.status(201).json({ 
      message: `Atraso registrado como ${concepto} y correo enviado`,
      concepto,
      requiereCertificado,
      trajoCertificado
    });
  } catch (error) {
    console.error("Error completo:", error);
    
    // Si hay un archivo subido y hay error, eliminarlo
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Archivo eliminado debido al error:", req.file.path);
      } catch (unlinkError) {
        console.error("Error al eliminar archivo:", unlinkError);
      }
    }
    
    // Manejar errores específicos de multer
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "El archivo es demasiado grande. Máximo 5MB." });
      }
      return res.status(400).json({ error: "Error en la subida del archivo: " + error.message });
    }
    
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 2. Obtener estadísticas
router.get('/statistics', async (req, res) => {
  try {
    const statsByDay = await Tardiness.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$fecha",
              timezone: "America/Santiago"
            }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const statsByCourse = await Tardiness.aggregate([
      {
        $group: {
          _id: "$curso",
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const statsByStudent = await Tardiness.aggregate([
      {
        $group: {
          _id: "$studentRut",
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Obtener todos los atrasos ordenados por fecha
    const allTardiness = await Tardiness.find().sort({ fecha: -1 });

    res.json({ 
      statsByDay, 
      statsByCourse, 
      statsByStudent,
      allTardiness 
    });
  } catch (error) {
    console.error("Error en estadísticas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ENDPOINT TEMPORAL PARA DIAGNOSTICAR FECHAS
router.get('/debug/dates', async (req, res) => {
  try {
    const allDates = await Tardiness.distinct('fecha');
    const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));
    
    const today = new Date();
    const todayChile = new Date(today.toLocaleString("en-US", {timeZone: "America/Santiago"}));
    const todayStr = todayChile.toISOString().split('T')[0];
    
    res.json({
      fechaActual: todayStr,
      fechaActualCompleta: todayChile.toISOString(),
      totalFechas: allDates.length,
      ultimas10Fechas: sortedDates.slice(0, 10),
      hoyExiste: sortedDates.some(date => 
        new Date(date).toISOString().split('T')[0] === todayStr
      )
    });
  } catch (error) {
    console.error("Error en debug/dates:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 2.1. Obtener estadísticas del día actual
router.get('/statistics/today', async (req, res) => {
  try {
    // Obtener fecha de hoy en zona horaria de Chile
    const today = new Date();
    const todayChile = new Date(today.toLocaleString("en-US", {timeZone: "America/Santiago"}));
    const todayStr = todayChile.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log('📅 Obteniendo estadísticas para:', todayStr);
    console.log('🕐 Fecha actual completa:', todayChile.toISOString());
    
    // Primero, verificar qué fechas existen en la base de datos
    const allDates = await Tardiness.distinct('fecha');
    const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));
    console.log('📋 Fechas disponibles en BD (últimas 10):', sortedDates.slice(0, 10));
    
    // Obtener atrasos del día actual
    let todayTardiness = await Tardiness.find({
      fecha: {
        $gte: new Date(todayStr + 'T00:00:00.000Z'),
        $lt: new Date(todayStr + 'T23:59:59.999Z')
      }
    }).sort({ fecha: -1 });

    console.log('📊 Atrasos encontrados para hoy:', todayTardiness.length);
    
    // Si no hay datos para hoy, usar el día más reciente con datos
    if (todayTardiness.length === 0) {
      console.log('⚠️ No hay datos para hoy, buscando el día más reciente...');
      const latestDate = sortedDates[0]; // La fecha más reciente
      const latestDateStr = new Date(latestDate).toISOString().split('T')[0];
      
      console.log('🔄 Usando datos del día más reciente:', latestDateStr);
      
      todayTardiness = await Tardiness.find({
        fecha: {
          $gte: new Date(latestDateStr + 'T00:00:00.000Z'),
          $lt: new Date(latestDateStr + 'T23:59:59.999Z')
        }
      }).sort({ fecha: -1 });
      
      console.log('📊 Atrasos encontrados para el día más reciente:', todayTardiness.length);
    }
    
    // Si no hay datos para hoy, buscar los últimos registros
    if (todayTardiness.length === 0) {
      console.log('⚠️ No hay datos para hoy, buscando los últimos registros...');
      const latestTardiness = await Tardiness.find().sort({ fecha: -1 }).limit(5);
      console.log('📋 Últimos 5 registros encontrados:', 
        latestTardiness.map(r => ({ fecha: r.fecha, studentRut: r.studentRut })));
      
      // SOLUCIÓN TEMPORAL: Usar los datos de la fecha más reciente
      if (latestTardiness.length > 0) {
        console.log('🔄 Usando datos de la fecha más reciente:', latestTardiness[0].fecha);
        const latestDate = new Date(latestTardiness[0].fecha);
        const latestDateStr = latestDate.toISOString().split('T')[0];
        
        // Buscar atrasos de la fecha más reciente
        const latestDateTardiness = await Tardiness.find({
          fecha: {
            $gte: new Date(latestDateStr + 'T00:00:00.000Z'),
            $lt: new Date(latestDateStr + 'T23:59:59.999Z')
          }
        }).sort({ fecha: -1 });
        
        console.log('📊 Atrasos encontrados para la fecha más reciente:', latestDateTardiness.length);
        
        // Usar estos datos en lugar de los datos de hoy
        todayTardiness.push(...latestDateTardiness);
        console.log('✅ Total de atrasos a procesar:', todayTardiness.length);
      }
    }

    // Obtener estudiantes únicos del día (para evitar duplicados)
    const uniqueStudents = new Map();
    todayTardiness.forEach(record => {
      if (!uniqueStudents.has(record.studentRut)) {
        uniqueStudents.set(record.studentRut, record);
      }
    });
    
    const uniqueTodayTardiness = Array.from(uniqueStudents.values());

    // Calcular estadísticas del día (usando estudiantes únicos)
    const stats = {
      total: uniqueTodayTardiness.length, // Solo estudiantes únicos
      totalRecords: todayTardiness.length, // Total de registros (incluyendo duplicados)
      withCertificate: uniqueTodayTardiness.filter(r => r.trajoCertificado).length,
      withoutCertificate: uniqueTodayTardiness.filter(r => !r.trajoCertificado).length,
      present: uniqueTodayTardiness.filter(r => r.concepto === 'presente').length,
      latePresent: uniqueTodayTardiness.filter(r => r.concepto === 'atrasado-presente').length,
      absent: uniqueTodayTardiness.filter(r => r.concepto === 'ausente').length,
      byCourse: {},
      byHour: {}
    };

    // Agrupar por curso (usando estudiantes únicos)
    uniqueTodayTardiness.forEach(record => {
      if (!stats.byCourse[record.curso]) {
        stats.byCourse[record.curso] = 0;
      }
      stats.byCourse[record.curso]++;
    });

    // Agrupar por hora (usando estudiantes únicos)
    uniqueTodayTardiness.forEach(record => {
      const hour = record.hora.split(':')[0];
      if (!stats.byHour[hour]) {
        stats.byHour[hour] = 0;
      }
      stats.byHour[hour]++;
    });

    res.json({
      date: todayStr,
      stats,
      tardiness: uniqueTodayTardiness, // Solo estudiantes únicos para el frontend
      totalRecords: todayTardiness.length, // Total de registros (para debugging)
      uniqueStudents: uniqueTodayTardiness.length // Estudiantes únicos (para debugging)
    });
  } catch (error) {
    console.error("Error en estadísticas del día:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 3. Enviar reporte mensual a los apoderados
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
      // Comparamos usando "==" para que string y número se igualen en caso de discrepancia
      const studentAtrasos = reportData.filter(a => a.studentRut == student.rut);
      if (studentAtrasos.length > 0) {
        const nombreCompleto = `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`;
        let reporteTexto = `Reporte mensual de atrasos para ${nombreCompleto}:\n\n`;
        studentAtrasos.forEach(a => {
          reporteTexto += `Fecha: ${a.fecha.toLocaleDateString()}, Hora: ${a.hora}, Motivo: ${a.motivo}\n`;
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.correoApoderado,
          subject: 'Reporte Mensual de Atrasos',
          text: reporteTexto
        };

        try {
          const info = await sendMail(mailOptions);
          console.log("Reporte mensual enviado:", info.response);
        } catch (error) {
          console.error("Error al enviar reporte mensual:", error);
        }
      }
    }

    res.json({ message: "Reportes enviados" });
  } catch (error) {
    console.error("Error en reporte mensual:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 4. Obtener todos los atrasos
router.get('/', async (req, res) => {
  try {
    const tardiness = await Tardiness.find().sort({ fecha: -1 });
    res.json(tardiness);
  } catch (error) {
    console.error("Error al obtener atrasos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 5. Descargar certificado médico
router.get('/certificado/:filename', ensureAuthenticated, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/certificados', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }
    
    // Enviar el archivo
    res.download(filePath);
  } catch (error) {
    console.error("Error al descargar certificado:", error);
    res.status(500).json({ error: "Error al descargar el archivo" });
  }
});

module.exports = router;
