// routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const { ensureAuthenticated, checkRole } = require('../middlewares/auth');
const mongoose = require('mongoose');

// GET /api/students/curso - Obtiene la lista única de cursos
router.get('/curso', async (req, res) => {
  try {
    let distinctCourses = await Student.distinct('curso');
    const order = ["PRE-K", "kinder", "1°A", "2°A", "3°A", "4°A", "5°A", "6°A", "7°A", "8°A", "I°M", "II°M", "III°M", "IV°M"];
    distinctCourses.sort((a, b) => {
      const indexA = order.indexOf(a.trim());
      const indexB = order.indexOf(b.trim());
      return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
    });
    res.json(distinctCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener cursos" });
  }
});

// Obtener todos los estudiantes
router.get('/', async (req, res) => {
  try {
    const { curso } = req.query;
    let query = {};
    
    if (curso && curso !== 'Todos los cursos') {
      // Búsqueda exacta ignorando mayúsculas y espacios extra
      query.curso = { $regex: new RegExp('^' + curso.trim() + '$', 'i') };
    }
    
    const students = await Student.find(query);
    res.json(students);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener estudiante por ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear nuevo estudiante
router.post('/', ensureAuthenticated, checkRole(['admin', 'usuario']), async (req, res) => {
  const student = new Student({
    rut: req.body.rut,
    nombres: req.body.nombres,
    apellidosPaterno: req.body.apellidosPaterno,
    apellidosMaterno: req.body.apellidosMaterno,
    curso: req.body.curso,
    correoApoderado: req.body.correoApoderado
  });

  try {
    const newStudent = await student.save();
    // Registrar actividad
    let performedBy = (req.user && req.user.username) ? req.user.username : 'Desconocido';
    await ActivityLog.create({
      user: performedBy,
      action: 'Crear estudiante',
      details: `Estudiante creado: ${newStudent.nombres} ${newStudent.apellidosPaterno}`
    });
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Importación masiva de estudiantes
router.post('/bulk', ensureAuthenticated, checkRole(['admin', 'usuario']), async (req, res) => {
  try {
    const students = req.body;
    const insertedStudents = await Student.insertMany(students, { ordered: false });
    // Registrar actividad
    let performedBy = (req.user && req.user.username) ? req.user.username : 'Desconocido';
    await ActivityLog.create({
      user: performedBy,
      action: 'Importar estudiantes',
      details: `Estudiantes importados: ${insertedStudents.length}`
    });
    res.status(201).json({
      message: 'Estudiantes importados exitosamente',
      count: insertedStudents.length
    });
  } catch (error) {
    // Manejar errores de duplicados
    if (error.code === 11000) {
      res.status(400).json({
        message: 'Algunos estudiantes no pudieron ser importados debido a RUTs duplicados',
        error: error.message
      });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Actualizar estudiante
router.put('/:id', ensureAuthenticated, checkRole(['admin', 'usuario']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      student.rut = req.body.rut || student.rut;
      student.nombres = req.body.nombres || student.nombres;
      student.apellidosPaterno = req.body.apellidosPaterno || student.apellidosPaterno;
      student.apellidosMaterno = req.body.apellidosMaterno || student.apellidosMaterno;
      student.curso = req.body.curso || student.curso;
      student.correoApoderado = req.body.correoApoderado || student.correoApoderado;

      const updatedStudent = await student.save();
      // Registrar actividad
      let performedBy = (req.user && req.user.username) ? req.user.username : 'Desconocido';
      await ActivityLog.create({
        user: performedBy,
        action: 'Editar estudiante',
        details: `Estudiante editado: ${updatedStudent.nombres} ${updatedStudent.apellidosPaterno}`
      });
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar estudiante
router.delete('/:id', ensureAuthenticated, checkRole(['admin', 'usuario']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de estudiante no válido' });
    }
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (deletedStudent) {
      // Registrar actividad
      let performedBy = (req.user && req.user.username) ? req.user.username : 'Desconocido';
      await ActivityLog.create({
        user: performedBy,
        action: 'Eliminar estudiante',
        details: `Estudiante eliminado: ${deletedStudent.nombres} ${deletedStudent.apellidosPaterno}`
      });
      res.json({ message: 'Estudiante eliminado' });
    } else {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
