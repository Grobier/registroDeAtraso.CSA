import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL; // Usa directamente la variable de entorno

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para el formulario de estudiante
  const [studentForm, setStudentForm] = useState({
    rut: '',
    nombres: '',
    apellidosPaterno: '',
    apellidosMaterno: '',
    curso: '',
    correoApoderado: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  // Cargar estudiantes
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students`, { withCredentials: true });
      setStudents(response.data);
      setFilteredStudents(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error al cargar los estudiantes');
      setLoading(false);
    }
  };

  // Cargar cursos
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/curso`); // No requiere auth
      setCourses(response.data);
    } catch (error) {
      setError('Error al cargar los cursos');
    }
  };

  // Filtrar estudiantes
  useEffect(() => {
    const filtered = students.filter(student => {
      const matchesSearch = 
        student.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.apellidosPaterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rut.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = !selectedCourse || student.curso === selectedCourse;
      return matchesSearch && matchesCourse;
    });
    setFilteredStudents(filtered);
  }, [searchTerm, selectedCourse, students]);

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value
    });
  };

  // Validar correo electrónico
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Guardar estudiante
  const handleSaveStudent = async () => {
    if (!isValidEmail(studentForm.correoApoderado)) {
      setError('Por favor ingrese un correo electrónico válido');
      return;
    }

    try {
      if (currentStudent) {
        // Actualizar estudiante existente
        await axios.put(`${API_BASE_URL}/api/students/${currentStudent._id}`, studentForm, { withCredentials: true });
        setSuccess('Estudiante actualizado exitosamente');
      } else {
        // Crear nuevo estudiante
        await axios.post(`${API_BASE_URL}/api/students`, studentForm, { withCredentials: true });
        setSuccess('Estudiante creado exitosamente');
      }
      
      fetchStudents();
      setShowModal(false);
      setCurrentStudent(null);
      setStudentForm({
        rut: '',
        nombres: '',
        apellidosPaterno: '',
        apellidosMaterno: '',
        curso: '',
        correoApoderado: ''
      });
    } catch (error) {
      setError('Error al guardar el estudiante');
    }
  };

  // Eliminar estudiante
  const handleDeleteStudent = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este estudiante?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/students/${id}`, { withCredentials: true });
        setSuccess('Estudiante eliminado exitosamente');
        fetchStudents();
      } catch (error) {
        setError('Error al eliminar el estudiante');
      }
    }
  };

  // Importar desde Excel
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Validar y formatear datos
        const formattedData = data.map(row => ({
          rut: row.rut || '',
          nombres: row.nombres || '',
          apellidosPaterno: row.apellidosPaterno || '',
          apellidosMaterno: row.apellidosMaterno || '',
          curso: row.curso || '',
          correoApoderado: row.correoApoderado || ''
        }));

        // Enviar datos al servidor
        await axios.post(`${API_BASE_URL}/api/students/bulk`, formattedData, { withCredentials: true });
        setSuccess('Estudiantes importados exitosamente');
        fetchStudents();
      } catch (error) {
        setError('Error al importar estudiantes');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Container className="mt-4">
      <h1>Gestión de Estudiantes</h1>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Buscar estudiante</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre o RUT"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrar por curso</Form.Label>
                <Form.Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Todos los cursos</option>
                  {courses.map((course, index) => (
                    <option key={index} value={course}>{course}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5} className="text-end">
              <Button variant="primary" onClick={() => {
                setCurrentStudent(null);
                setStudentForm({
                  rut: '',
                  nombres: '',
                  apellidosPaterno: '',
                  apellidosMaterno: '',
                  curso: '',
                  correoApoderado: ''
                });
                setShowModal(true);
              }} className="me-2">
                <i className="fas fa-plus me-2"></i>
                Nuevo Estudiante
              </Button>
              <Form.Label htmlFor="importExcel" className="btn btn-success mb-0">
                <i className="fas fa-file-excel me-2"></i>
                Importar desde Excel
              </Form.Label>
              <Form.Control
                type="file"
                id="importExcel"
                accept=".xlsx,.xls"
                className="d-none"
                onChange={handleImportExcel}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contador de estudiantes */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col>
              <h5 className="mb-0">
                Total de estudiantes: <span className="text-primary">{students.length}</span>
                {filteredStudents.length !== students.length && (
                  <span className="ms-3">
                    Estudiantes filtrados: <span className="text-success">{filteredStudents.length}</span>
                  </span>
                )}
              </h5>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>RUT</th>
              <th>Nombre Completo</th>
              <th>Curso</th>
              <th>Correo Apoderado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.rut}</td>
                <td>{`${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`}</td>
                <td>{student.curso}</td>
                <td>{student.correoApoderado}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setCurrentStudent(student);
                      setStudentForm(student);
                      setShowModal(true);
                    }}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteStudent(student._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal para crear/editar estudiante */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>RUT</Form.Label>
              <Form.Control
                type="text"
                name="rut"
                value={studentForm.rut}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombres</Form.Label>
              <Form.Control
                type="text"
                name="nombres"
                value={studentForm.nombres}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Apellido Paterno</Form.Label>
              <Form.Control
                type="text"
                name="apellidosPaterno"
                value={studentForm.apellidosPaterno}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Apellido Materno</Form.Label>
              <Form.Control
                type="text"
                name="apellidosMaterno"
                value={studentForm.apellidosMaterno}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Curso</Form.Label>
              <Form.Select
                name="curso"
                value={studentForm.curso}
                onChange={handleFormChange}
                required
              >
                <option value="">Seleccione un curso</option>
                {courses.map((course, index) => (
                  <option key={index} value={course}>{course}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Correo Apoderado</Form.Label>
              <Form.Control
                type="email"
                name="correoApoderado"
                value={studentForm.correoApoderado}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveStudent}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentManagement;