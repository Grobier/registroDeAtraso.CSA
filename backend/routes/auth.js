// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Session = require('../models/Session');
const ActivityLog = require('../models/ActivityLog');
const passport = require('passport');

// Middleware para verificar autenticación
const { ensureAuthenticated } = require('../middlewares/auth');

// Login con manejo manual de sesión
router.post('/login', (req, res, next) => {
  console.log('\n=== INTENTANDO LOGIN ===');
  console.log('Body recibido:', req.body);
  console.log('Session ID antes del login:', req.sessionID);
  console.log('Cookies antes del login:', req.cookies);
  
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.log('❌ Error en autenticación:', err);
      return next(err);
    }
    if (!user) {
      console.log('❌ Usuario no encontrado o credenciales incorrectas');
      return res.status(401).json({ message: info?.message || 'Credenciales incorrectas' });
    }
    
    console.log('✅ Usuario autenticado correctamente:', user.username);
    
    req.login(user, (err) => {
      if (err) {
        console.log('❌ Error en req.login:', err);
        return next(err);
      }
      
      console.log('✅ Login exitoso - Sesión establecida');
      console.log('Session ID después del login:', req.sessionID);
      console.log('req.user después del login:', req.user);
      console.log('req.isAuthenticated():', req.isAuthenticated());
      console.log('Cookies después del login:', req.cookies);
      
      // Aquí la sesión está establecida y Passport serializó el usuario
      res.json({
        message: 'Login exitoso',
        sessionId: req.sessionID,
        role: user.role
      });
    });
  })(req, res, next);
});

// Ruta para registro de nuevos usuarios
router.post('/register', ensureAuthenticated, async (req, res) => {
  console.log('--- Intento de crear usuario ---');
  console.log('req.session:', req.session);
  console.log('req.user:', req.user);
  try {
    const { username, password, email, role } = req.body;

    // Validar que los campos no estén vacíos
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validar rol
    const validRoles = ['admin', 'usuario'];
    const userRole = validRoles.includes(role) ? role : 'usuario';

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Verificar si el correo ya existe
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    // Crear un nuevo usuario
    const newUser = new User({ username, password, email, role: userRole });
    await newUser.save();

    // Registrar actividad
    let performedBy = 'Desconocido';
    if (req.user && req.user.username) {
      performedBy = req.user.username;
    }
    await ActivityLog.create({
      user: performedBy,
      action: 'Creación de usuario',
      details: `Usuario creado: ${username}`
    });

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta para cambiar contraseña
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, sessionId } = req.body;

    // Buscar la sesión
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Sesión no válida' });
    }

    // Buscar usuario
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    // Registrar actividad de cambio de contraseña
    await ActivityLog.create({
      user: user.username || 'Desconocido',
      action: 'Cambio de contraseña',
      details: `Usuario cambió su contraseña.`
    });
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para listar todos los usuarios (solo admin)
router.get('/users', ensureAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });
  try {
    const users = await User.find({}, '-password'); // No enviar el hash de la contraseña
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Endpoint para editar usuario (solo admin)
router.put('/users/:id', ensureAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });
  try {
    const { username, email, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { username, email, role }, { new: true, runValidators: true });
    res.json({ message: 'Usuario actualizado', user });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Endpoint para eliminar usuario (solo admin)
router.delete('/users/:id', ensureAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// Endpoint para resetear contraseña de usuario (solo admin)
router.post('/users/:id/reset-password', ensureAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Contraseña reseteada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al resetear contraseña' });
  }
});

module.exports = router;
