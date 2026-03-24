const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuracion unificada de Nodemailer con timeouts apropiados.
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
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: options.connectionTimeout || 60000,
    greetingTimeout: options.greetingTimeout || 30000,
    socketTimeout: options.socketTimeout || 60000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    debug: !isProduction,
    logger: !isProduction
  });
};

// Funcion para enviar correo con manejo de errores mejorado.
const sendEmail = async (mailOptions, timeout = 30000) => {
  const transporter = createEmailTransporter();

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      transporter.close();
      reject(new Error('Email sending timeout after 30 seconds'));
    }, timeout);

    transporter.sendMail(mailOptions, (error, info) => {
      clearTimeout(timeoutId);

      if (error) {
        transporter.close();

        console.error('Error detallado al enviar correo:', {
          code: error.code,
          command: error.command,
          response: error.response,
          message: error.message
        });

        const errorMessage = error.code === 'ETIMEDOUT'
          ? 'Timeout de conexion SMTP - verificar configuracion de red'
          : error.message || 'Error desconocido al enviar correo';

        reject(new Error(errorMessage));
        return;
      }

      console.log('Correo enviado exitosamente:', info.messageId);
      resolve(info);
    });
  });
};

// Verificacion inicial no bloqueante para evitar ruido cuando Render despierta la instancia.
const verifyEmailConnection = async (options = {}) => {
  const {
    timeout = 12000,
    logErrors = false
  } = options;

  const transporter = createEmailTransporter({
    connectionTimeout: timeout,
    greetingTimeout: Math.min(timeout, 10000),
    socketTimeout: timeout
  });

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      transporter.close();
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      finish({
        ok: false,
        code: 'VERIFY_TIMEOUT',
        message: 'La verificacion SMTP excedio el tiempo de espera.'
      });
    }, timeout);

    transporter.verify((error, success) => {
      if (error) {
        if (logErrors) {
          console.warn('Advertencia en verificacion SMTP:', {
            code: error.code,
            command: error.command,
            message: error.message
          });
        }

        finish({
          ok: false,
          code: error.code || 'VERIFY_ERROR',
          message: error.message || 'No fue posible verificar SMTP.'
        });
        return;
      }

      finish({
        ok: Boolean(success),
        code: 'SMTP_READY',
        message: 'Servidor SMTP disponible.'
      });
    });
  });
};

module.exports = {
  createEmailTransporter,
  sendEmail,
  verifyEmailConnection
};
