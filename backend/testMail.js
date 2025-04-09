// testMail.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // Asegura que las variables de entorno se carguen

// Configuración del transporter con debug y logger activados
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail
    pass: process.env.EMAIL_PASS  // Tu contraseña o App Password
  },
  debug: true,   // Muestra información de debug en la consola
  logger: true   // Registra la actividad del transporter
});

// Imprime la configuración actual para verificar
console.log("Configuración del transporter:", transporter.options);

// Verifica la conexión SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("Error en transporter.verify:", error);
  } else {
    console.log("Transporter verificado correctamente:", success);
    
    // Configura el correo de prueba
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'grobier.2h@gmail.com', // Cambia esto por un correo de prueba real
      subject: 'Correo de prueba desde testMail.js',
      text: 'Este es un correo de prueba para verificar que Nodemailer funciona correctamente.'
    };

    // Envía el correo de prueba
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error al enviar correo:", error);
      } else {
        console.log("Correo enviado correctamente, respuesta:", info.response);
        console.log("Información completa:", info);
      }
    });
  }
});
