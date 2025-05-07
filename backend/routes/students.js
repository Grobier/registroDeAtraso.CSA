// routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Tardiness = require('../models/Tardiness'); // Asegúrate de importar el modelo

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
router.post('/', async (req, res) => {
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
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Importación masiva de estudiantes
router.post('/bulk', async (req, res) => {
  try {
    const students = req.body;
    const insertedStudents = await Student.insertMany(students, { ordered: false });
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
router.put('/:id', async (req, res) => {
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
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar estudiante y sus registros asociados
router.delete('/:id', async (req, res) => {
  try {
    console.log("DEBUG: Iniciando eliminación del estudiante. ID:", req.params.id);
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log("DEBUG: No se encontró el estudiante con ID:", req.params.id);
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    
    console.log("DEBUG: Estudiante encontrado. Rut:", student.rut);
    
    console.log("DEBUG: Procediendo a eliminar el estudiante...");
    const deletionResult = await Student.deleteOne({ _id: req.params.id });
    console.log("DEBUG: Resultado de eliminación:", deletionResult);
    if (deletionResult.deletedCount === 0) {
      console.log("DEBUG: No se eliminó ningún documento");
      return res.status(500).json({ message: 'No se pudo eliminar el estudiante' });
    }
    
    console.log("DEBUG: Estudiante eliminado exitosamente:", student);
    return res.json({ message: 'Estudiante eliminado' });
  } catch (error) {
    console.error("DEBUG: Error en la ruta DELETE /api/students/:id:", error);
    console.error("DEBUG: Stack:", error.stack);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
