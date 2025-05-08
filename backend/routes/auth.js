// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Session = require('../models/Session');

// Middleware para verificar autenticación
const auth = require('../middlewares/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // 3. Crear sesión
    const session = new Session({
      userId: user._id,
      // createdAt y expiresAt se establecen por defecto
    });
    await session.save();

    // 4. Devolver sessionId (podrías enviarlo en una cookie httpOnly)
    res.json({
      message: 'Login exitoso',
      sessionId: session._id, 
      role: user.role  // para uso rápido en frontend (opcional)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para registro de nuevos usuarios
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validar que los campos no estén vacíos
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

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
    const newUser = new User({ username, password, email, role: 'registrador' });
    await newUser.save();

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta para cambiar contraseña
router.post('/change-password', async (req, res) => {
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

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
