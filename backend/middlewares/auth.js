// middlewares/auth.js
function ensureAuthenticated(req, res, next) {
    console.log('--- Paso por ensureAuthenticated ---');
    console.log('req.session:', req.session);
    console.log('req.user:', req.user);
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

  function checkRole(roles) {
    return function(req, res, next) {
      if (req.isAuthenticated() && req.user && roles.includes(req.user.role)) {
        return next();
      }
      res.status(403).json({ message: "No autorizado, se requiere rol: " + roles.join(', ') });
    };
  }
  
  module.exports = { ensureAuthenticated, checkAdmin, checkRole };
  