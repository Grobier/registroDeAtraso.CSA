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
    console.log('🔍 [BACKEND] GET /api/students/curso - Iniciado');
    
    // Primero, vamos a ver cuántos estudiantes hay en total
    const totalStudents = await Student.countDocuments({});
    console.log('🔍 [BACKEND] Total de estudiantes en la base de datos:', totalStudents);
    
    // Verificar si hay estudiantes con estado 'activo'
    const activeStudents = await Student.countDocuments({ estado: 'activo' });
    console.log('🔍 [BACKEND] Estudiantes con estado "activo":', activeStudents);
    
    // Verificar si hay estudiantes sin campo estado
    const studentsWithoutEstado = await Student.countDocuments({ estado: { $exists: false } });
    console.log('🔍 [BACKEND] Estudiantes sin campo estado:', studentsWithoutEstado);
    
    // Verificar todos los valores únicos del campo estado
    const uniqueEstados = await Student.distinct('estado');
    console.log('🔍 [BACKEND] Valores únicos del campo estado:', uniqueEstados);
    
    // CAMBIO: Obtener cursos de estudiantes activos Y estudiantes sin campo estado
    let distinctCourses = await Student.distinct('curso', {
      $or: [
        { estado: 'activo' },
        { estado: { $exists: false } }
      ]
    });
    console.log('🔍 [BACKEND] Cursos de estudiantes activos y sin estado:', distinctCourses);
    
    // Obtener cursos de TODOS los estudiantes (sin filtro de estado)
    let allCourses = await Student.distinct('curso');
    console.log('🔍 [BACKEND] Cursos de TODOS los estudiantes:', allCourses);
    
    const order = ["PRE-K", "kinder", "1°A", "2°A", "3°A", "4°A", "5°A", "6°A", "7°A", "8°A", "I°M", "II°M", "III°M", "IV°M"];
    distinctCourses.sort((a, b) => {
      const indexA = order.indexOf(a.trim());
      const indexB = order.indexOf(b.trim());
      return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
    });
    
    console.log('🔍 [BACKEND] Cursos ordenados finales:', distinctCourses);
    res.json(distinctCourses);
  } catch (error) {
    console.error('❌ [BACKEND] Error al obtener cursos:', error);
    res.status(500).json({ error: "Error al obtener cursos" });
  }
});

// GET /api/students/egresados - Obtiene estudiantes egresados
router.get('/egresados', async (req, res) => {
  try {
    const egresados = await Student.find({ estado: 'egresado' }).sort({ fechaEgreso: -1 });
    res.json(egresados);
  } catch (error) {
    console.error('Error al obtener egresados:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/students/repitentes - Obtiene estudiantes repitentes
router.get('/repitentes', async (req, res) => {
  try {
    const repitentes = await Student.find({ repite: true, estado: 'activo' }).sort({ curso: 1, apellidosPaterno: 1 });
    res.json(repitentes);
  } catch (error) {
    console.error('Error al obtener repitentes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener todos los estudiantes
router.get('/', async (req, res) => {
  try {
    console.log('🔍 [BACKEND] GET /api/students - Iniciado');
    const { curso, estado } = req.query;
    
    // CAMBIO: Incluir estudiantes activos Y estudiantes sin campo estado
    let query = {
      $or: [
        { estado: 'activo' },
        { estado: { $exists: false } }
      ]
    };
    
    console.log('🔍 [BACKEND] Query original:', query);
    console.log('🔍 [BACKEND] Parámetros recibidos:', { curso, estado });
    
    if (curso && curso !== 'Todos los cursos') {
      // Búsqueda exacta ignorando mayúsculas y espacios extra
      query.curso = { $regex: new RegExp('^' + curso.trim() + '$', 'i') };
    }
    
    if (estado) {
      query.estado = estado;
    }
    
    console.log('🔍 [BACKEND] Query final:', JSON.stringify(query));
    
    // Primero, vamos a ver cuántos estudiantes hay en total
    const totalStudents = await Student.countDocuments({});
    console.log('🔍 [BACKEND] Total de estudiantes en la base de datos:', totalStudents);
    
    // Verificar si hay estudiantes con estado 'activo'
    const activeStudents = await Student.countDocuments({ estado: 'activo' });
    console.log('🔍 [BACKEND] Estudiantes con estado "activo":', activeStudents);
    
    // Verificar si hay estudiantes sin campo estado
    const studentsWithoutEstado = await Student.countDocuments({ estado: { $exists: false } });
    console.log('🔍 [BACKEND] Estudiantes sin campo estado:', studentsWithoutEstado);
    
    // Verificar todos los valores únicos del campo estado
    const uniqueEstados = await Student.distinct('estado');
    console.log('🔍 [BACKEND] Valores únicos del campo estado:', uniqueEstados);
    
    const students = await Student.find(query);
    console.log('🔍 [BACKEND] Estudiantes encontrados con query:', students.length);
    console.log('🔍 [BACKEND] Primeros 3 estudiantes:', students.slice(0, 3));
    
    res.json(students);
  } catch (error) {
    console.error('❌ [BACKEND] Error al obtener estudiantes:', error);
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

// Importación masiva de estudiantes (upsert + eliminar los que no están en el archivo)
router.post('/bulk', ensureAuthenticated, checkRole(['admin', 'usuario']), async (req, res) => {
  try {
    const students = req.body;
    if (!students || students.length === 0) {
      return res.status(400).json({ message: 'El archivo no contiene estudiantes' });
    }

    const rutsEnArchivo = students.map(s => s.rut);

    // Upsert de todos los alumnos del archivo
    const operations = students.map(s => ({
      updateOne: {
        filter: { rut: s.rut },
        update: { $set: {
          nombres: s.nombres,
          apellidosPaterno: s.apellidosPaterno,
          apellidosMaterno: s.apellidosMaterno,
          curso: s.curso,
          correoApoderado: s.correoApoderado,
          estado: 'activo'
        }},
        upsert: true
      }
    }));
    const result = await Student.bulkWrite(operations);

    // Eliminar alumnos que NO están en el archivo
    const deleteResult = await Student.deleteMany({ rut: { $nin: rutsEnArchivo } });

    let performedBy = (req.user && req.user.username) ? req.user.username : 'Desconocido';
    await ActivityLog.create({
      user: performedBy,
      action: 'Importar estudiantes',
      details: `Nuevos: ${result.upsertedCount}, Actualizados: ${result.modifiedCount}, Eliminados: ${deleteResult.deletedCount}`
    });

    res.status(201).json({
      message: 'Nómina actualizada exitosamente',
      nuevos: result.upsertedCount,
      actualizados: result.modifiedCount,
      eliminados: deleteResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar estudiante
router.put('/:id', ensureAuthenticated, checkRole(['admin', 'usuario']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      // Actualizar campos básicos
      student.rut = req.body.rut || student.rut;
      student.nombres = req.body.nombres || student.nombres;
      student.apellidosPaterno = req.body.apellidosPaterno || student.apellidosPaterno;
      student.apellidosMaterno = req.body.apellidosMaterno || student.apellidosMaterno;
      student.curso = req.body.curso || student.curso;
      student.correoApoderado = req.body.correoApoderado || student.correoApoderado;
      
      // Actualizar campos de repitente
      if (req.body.hasOwnProperty('repite')) {
        student.repite = req.body.repite;
      }
      if (req.body.motivoRepitencia) {
        student.motivoRepitencia = req.body.motivoRepitencia;
      }

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

