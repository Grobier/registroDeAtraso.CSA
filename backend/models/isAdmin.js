// backend/middlewares/isAdmin.js
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    // req.sessionData tiene el session.userId
    const user = await User.findById(req.sessionData.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};

module.exports = isAdmin;
