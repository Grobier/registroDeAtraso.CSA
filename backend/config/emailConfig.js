require('dotenv').config();

const RESEND_API_URL = 'https://api.resend.com/emails';

const getSenderEmail = () =>
  process.env.RESEND_FROM ||
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER;

const verifyEmailConnection = async () => {
  const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY);
  const senderConfigured = Boolean(getSenderEmail());

  if (!apiKeyConfigured || !senderConfigured) {
    return {
      ok: false,
      code: 'RESEND_CONFIG_MISSING',
      message: 'Falta configurar RESEND_API_KEY o RESEND_FROM.'
    };
  }

  return {
    ok: true,
    code: 'RESEND_READY',
    message: 'Configuracion de Resend disponible.'
  };
};

const sendEmail = async (mailOptions, timeout = 20000) => {
  const sender = mailOptions.from || getSenderEmail();

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  if (!sender) {
    throw new Error('No hay remitente configurado. Defina RESEND_FROM.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const payload = {
      from: sender,
      to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      subject: mailOptions.subject,
      text: mailOptions.text
    };

    if (mailOptions.html) {
      payload.html = mailOptions.html;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) && data.errors[0]?.message) ||
        `Resend request failed with status ${response.status}`;
      const error = new Error(message);
      error.code = 'RESEND_API_ERROR';
      error.response = data;
      throw error;
    }

    const info = {
      messageId: data.id,
      accepted: payload.to,
      rejected: [],
      response: 'accepted'
    };

    console.log('Correo enviado exitosamente:', info.messageId);
    return info;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Email sending timeout after ${Math.round(timeout / 1000)} seconds`);
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }

    console.error('Error detallado al enviar correo:', {
      code: error.code,
      response: error.response,
      message: error.message
    });

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  sendEmail,
  verifyEmailConnection,
  createEmailTransporter: null
};
