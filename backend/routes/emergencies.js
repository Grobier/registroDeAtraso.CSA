const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const EmergencyLog = require('../models/EmergencyLog');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail } = require('../config/emailConfig');
const { ensureAuthenticated } = require('../middlewares/auth');

router.post('/send', ensureAuthenticated, async (req, res) => {
  try {
    const {
      studentRut,
      templateKey,
      templateLabel,
      subject,
      message,
      observations = '',
      atencion = {}
    } = req.body;

    if (!studentRut || !templateKey || !templateLabel || !subject || !message) {
      return res.status(400).json({ message: 'Faltan datos requeridos para enviar la emergencia' });
    }

    const student = await Student.findOne({ rut: studentRut });
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    if (!student.correoApoderado || !student.correoApoderado.trim()) {
      return res.status(400).json({ message: 'El estudiante no tiene correo de apoderado registrado' });
    }

    const studentName = `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`.replace(/\s+/g, ' ').trim();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'tu-email@gmail.com',
      to: student.correoApoderado,
      subject,
      html: message.replace(/\n/g, '<br>')
    };

    let status = 'enviado';
    let errorMessage = '';

    try {
      await sendEmail(mailOptions);
    } catch (error) {
      status = 'error';
      errorMessage = error.message || 'Error desconocido al enviar correo';
    }

    await EmergencyLog.create({
      studentRut: student.rut,
      studentName,
      course: student.curso || 'Sin curso',
      guardianEmail: student.correoApoderado,
      templateKey,
      templateLabel,
      subject,
      message,
      atencion,
      observations: observations.trim(),
      sentBy: req.user.username || req.user.email,
      status,
      error: errorMessage
    });

    await ActivityLog.create({
      user: req.user.username || req.user.email,
      action: 'Enviar emergencia',
      details: `${templateLabel} a ${studentName} (${student.rut}) - estado: ${status}`
    });

    if (status === 'error') {
      return res.status(500).json({
        message: 'La emergencia fue registrada, pero el correo no pudo enviarse',
        status,
        error: errorMessage
      });
    }

    res.json({
      message: 'Aviso de emergencia enviado y registrado correctamente',
      status
    });
  } catch (error) {
    console.error('Error al enviar emergencia:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/history', ensureAuthenticated, async (req, res) => {
  try {
    const history = await EmergencyLog.find().sort({ fechaEnvio: -1 }).limit(100);
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial de emergencias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
