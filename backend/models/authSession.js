// backend/middlewares/authSession.js
const Session = require('../models/Session');

const authSession = async (req, res, next) => {
  try {
    const sessionId = req.headers.authorization?.split(' ')[1]; 
    // o si lo guardas en cookie: req.cookies.sessionId

    if (!sessionId) {
      return res.status(401).json({ message: 'No se encontró la sesión' });
    }

    // Verificamos que la sesión exista y que no haya expirado
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(403).json({ message: 'Sesión inválida' });
    }

    // Verificar fecha de expiración
    if (new Date() > session.expiresAt) {
      // Sesión expirada
      await Session.findByIdAndDelete(sessionId);
      return res.status(403).json({ message: 'Sesión expirada' });
    }

    // Guardar info de la sesión (ejemplo, userId) en req
    req.sessionData = session;
    next();

  } catch (error) {
    console.error(error);
    return res.status(403).json({ message: 'Autenticación fallida' });
  }
};

module.exports = authSession;
