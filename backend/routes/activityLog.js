const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { checkRole } = require('../middlewares/auth');

// Registrar una nueva actividad
router.post('/', async (req, res) => {
  try {
    const { user, action, details } = req.body;
    const log = new ActivityLog({ user, action, details });
    await log.save();
    res.status(201).json({ message: 'Actividad registrada', log });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar actividad', error });
  }
});

// Obtener historial de actividades (opcional: paginación, filtros, etc.)
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial', error });
  }
});

// Eliminar un registro de actividad por ID
router.delete('/:id', checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Intentando borrar registro de actividad con ID:', id);
    const deleted = await ActivityLog.findByIdAndDelete(id);
    console.log('Resultado de findByIdAndDelete:', deleted);
    if (!deleted) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ message: 'Error al eliminar registro', error });
  }
});

module.exports = router; 