// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Session = require('../models/Session');

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

module.exports = router;
