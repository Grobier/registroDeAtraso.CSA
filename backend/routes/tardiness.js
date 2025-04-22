// routes/tardiness.js
const express = require('express');
const router = express.Router();
const Tardiness = require('../models/Tardiness');
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
require('dotenv').config();

// Configuración de Nodemailer con debug y logger activados
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2"
  },
  debug: true,
  logger: true
});

// Verificar la conexión SMTP al iniciar el servidor
transporter.verify((error, success) => {
  if (error) {
    console.error("Error en transporter.verify:", error);
  } else {
    console.log("SMTP Server está listo:", success);
  }
});

// Función para enviar correo (promisificada)
const sendMail = (options) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (error, info) => {
      if (error) {
        console.error("Error al enviar correo:", error);
        reject(error);
      } else {
        console.log("Correo enviado, respuesta completa:", info);
        resolve(info);
      }
    });
  });
};

// Función para limpiar completamente el RUT
const cleanRut = (rut) => {
  return rut.toString().trim().replace(/\s+/g, '');
};

// 1. Registrar un atraso (la hora se asigna automáticamente)
router.post('/', async (req, res) => {
  try {
    const { motivo, rut, curso } = req.body;
    
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

    // Asignar la hora actual del servidor con la zona horaria correcta
    const currentTime = moment().tz('America/Santiago').format('HH:mm'); // Cambia 'America/Santiago' por tu zona horaria

    // Guardar el registro de atraso en Tardiness usando el rut recibido (ya como string)
    const newTardiness = new Tardiness({ 
      hora: currentTime,
      motivo,
      studentRut: searchRut,  // Guardamos el rut limpio
      curso
    });
    await newTardiness.save();
    console.log("Registro de atraso guardado:", newTardiness);

    // Log 2: Buscar todos los estudiantes para verificar
    const todosLosEstudiantes = await Student.find({});
    console.log("\n=== ESTUDIANTES EN LA BASE DE DATOS ===");
    console.log("Número total de estudiantes:", todosLosEstudiantes.length);
    console.log("Lista de RUTs en la BD:", todosLosEstudiantes.map(s => ({
      rut: s.rut,
      tipo: typeof s.rut
    })));

    // Buscar el estudiante con una comparación más flexible
    const student = await Student.findOne({
      $or: [
        { rut: searchRut },
        { rut: { $regex: new RegExp(`^${searchRut}$`, 'i') } }
      ]
    });
    console.log("\n=== RESULTADO DE BÚSQUEDA ===");
    console.log("Estudiante encontrado:", student ? "SÍ" : "NO");
    
    if (student) {
      console.log("Datos del estudiante encontrado:", {
        rut: student.rut,
        nombres: student.nombres,
        curso: student.curso
      });
      // Log: mostrar el correo del apoderado
      console.log("Correo del apoderado:", student.correoApoderado);
      
      const nombreCompleto = `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.correoApoderado,
        subject: 'Notificación de Atraso',
        text: `Estimado(a) apoderado(a):

Le informamos que el estudiante ${nombreCompleto} registró un atraso el día ${newTardiness.fecha.toLocaleDateString()} a las ${currentTime}.
Motivo: ${motivo}

Le agradecemos su comprensión. Si tiene alguna duda, no dude en comunicarse con nosotros.

Atentamente,
Equipo de Convivencia Escolar`
      };

      // Enviar correo
      try {
        const mailInfo = await sendMail(mailOptions);
        console.log("Correo enviado:", mailInfo.response);
      } catch (mailError) {
        console.error("Error al enviar correo:", mailError);
      }
    } else {
      console.log("⚠️ No se encontró el estudiante. Comparación de RUTs:");
      console.log("RUT buscado:", searchRut);
      const estudianteSimilar = todosLosEstudiantes.find(s => s.rut.includes(searchRut) || searchRut.includes(s.rut));
      if (estudianteSimilar) {
        console.log("Se encontró un RUT similar:", estudianteSimilar.rut);
      }
    }

    res.status(201).json({ message: "Atraso registrado y correo enviado" });
  } catch (error) {
    console.error("Error completo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 2. Obtener estadísticas
router.get('/statistics', async (req, res) => {
  try {
    const statsByDay = await Tardiness.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
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

module.exports = router;
