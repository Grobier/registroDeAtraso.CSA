// middlewares/auth.js
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Usuario no autenticado" });
  }
  
  function checkAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "No autorizado, se requiere rol administrador" });
  }
  
  module.exports = { ensureAuthenticated, checkAdmin };
  