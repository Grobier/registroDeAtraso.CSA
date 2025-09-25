// config/emailConfig.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración unificada de Nodemailer con timeouts apropiados
const createEmailTransporter = (options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2"
    },
    // Configuración de timeouts para evitar ETIMEDOUT
    connectionTimeout: 60000, // 60 segundos para establecer conexión
    greetingTimeout: 30000,   // 30 segundos para saludo SMTP
    socketTimeout: 60000,     // 60 segundos para operaciones de socket
    // Configuración de pool para reutilizar conexiones
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Debug solo en desarrollo
    debug: !isProduction,
    logger: !isProduction
  });
};

// Función para enviar correo con manejo de errores mejorado
const sendEmail = async (mailOptions, timeout = 30000) => {
  const transporter = createEmailTransporter();
  
  return new Promise((resolve, reject) => {
    // Timeout personalizado para la operación completa
    const timeoutId = setTimeout(() => {
      transporter.close(); // Cerrar conexión en caso de timeout
      reject(new Error('Email sending timeout after 30 seconds'));
    }, timeout);

    transporter.sendMail(mailOptions, (error, info) => {
      clearTimeout(timeoutId);
      
      if (error) {
        // Cerrar conexión en caso de error
        transporter.close();
        
        // Log detallado del error
        console.error("Error detallado al enviar correo:", {
          code: error.code,
          command: error.command,
          response: error.response,
          message: error.message
        });
        
        // Rechazar con error más específico
        const errorMessage = error.code === 'ETIMEDOUT' 
          ? 'Timeout de conexión SMTP - verificar configuración de red'
          : error.message || 'Error desconocido al enviar correo';
          
        reject(new Error(errorMessage));
      } else {
        console.log("Correo enviado exitosamente:", info.messageId);
        resolve(info);
      }
    });
  });
};

// Función para verificar la conexión SMTP
const verifyEmailConnection = async () => {
  const transporter = createEmailTransporter();
  
  return new Promise((resolve, reject) => {
    transporter.verify((error, success) => {
      if (error) {
        console.error("Error en verificación SMTP:", error);
        reject(error);
      } else {
        console.log("SMTP Server está listo:", success);
        resolve(success);
      }
    });
  });
};

module.exports = {
  createEmailTransporter,
  sendEmail,
  verifyEmailConnection
};
