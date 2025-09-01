import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

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
    console.log('🔍 [DEBUG] useEffect inicial ejecutado');
    console.log('🔍 [DEBUG] API_BASE_URL en useEffect:', API_BASE_URL);
    console.log('🔍 [DEBUG] PROD:', import.meta.env.PROD);
    console.log('🔍 [DEBUG] VITE_API_URL:', import.meta.env.VITE_API_URL);
    fetchStudents();
    fetchCourses();
  }, []);

  // Cargar estudiantes
  const fetchStudents = async () => {
    console.log('🔍 [DEBUG] fetchStudents iniciado');
    console.log('🔍 [DEBUG] API_BASE_URL:', API_BASE_URL);
    console.log('🔍 [DEBUG] URL completa:', `${API_BASE_URL}/api/students`);
    
    try {
      console.log('🔍 [DEBUG] Haciendo petición GET a /api/students');
      const response = await axios.get(`${API_BASE_URL}/api/students`, { withCredentials: true });
      console.log('🔍 [DEBUG] Respuesta recibida:', response);
      console.log('🔍 [DEBUG] Status:', response.status);
      console.log('🔍 [DEBUG] Headers:', response.headers);
      console.log('🔍 [DEBUG] Data:', response.data);
      console.log('🔍 [DEBUG] Cantidad de estudiantes:', response.data.length);
      
      setStudents(response.data);
      setFilteredStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('❌ [DEBUG] Error en fetchStudents:', error);
      console.error('❌ [DEBUG] Error response:', error.response);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error status:', error.response?.status);
      console.error('❌ [DEBUG] Error data:', error.response?.data);
      setError('Error al cargar los estudiantes');
      setLoading(false);
    }
  };

  // Cargar estudiantes egresados
  const [egresados, setEgresados] = useState([]);
  const [showEgresados, setShowEgresados] = useState(false);

  const fetchEgresados = async () => {
    console.log('🔍 [DEBUG] fetchEgresados iniciado');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/egresados`, { withCredentials: true });
      console.log('🔍 [DEBUG] Respuesta egresados:', response.data);
      setEgresados(response.data);
    } catch (error) {
      console.error('❌ [DEBUG] Error en fetchEgresados:', error);
      console.error('❌ [DEBUG] Error response:', error.response);
    }
  };

  useEffect(() => {
    if (showEgresados) {
      fetchEgresados();
    }
  }, [showEgresados]);

  // Cargar estudiantes repitentes
  const [repitentes, setRepitentes] = useState([]);
  const [showRepitentes, setShowRepitentes] = useState(false);

  const fetchRepitentes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/repitentes`, { withCredentials: true });
      setRepitentes(response.data);
    } catch (error) {
      console.error('Error al cargar repitentes:', error);
    }
  };

  useEffect(() => {
    if (showRepitentes) {
      fetchRepitentes();
    }
  }, [showRepitentes]);

  // Cargar cursos
  const fetchCourses = async () => {
    console.log('🔍 [DEBUG] fetchCourses iniciado');
    console.log('🔍 [DEBUG] URL completa:', `${API_BASE_URL}/api/students/curso`);
    
    try {
      console.log('🔍 [DEBUG] Haciendo petición GET a /api/students/curso');
      const response = await axios.get(`${API_BASE_URL}/api/students/curso`); // No requiere auth
      console.log('🔍 [DEBUG] Respuesta cursos:', response);
      console.log('🔍 [DEBUG] Cursos recibidos:', response.data);
      console.log('🔍 [DEBUG] Cantidad de cursos:', response.data.length);
      setCourses(response.data);
    } catch (error) {
      console.error('❌ [DEBUG] Error en fetchCourses:', error);
      console.error('❌ [DEBUG] Error response:', error.response);
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

  // Descargar plantilla Excel
  const handleDownloadTemplate = () => {
    // Datos de ejemplo para la plantilla
    const templateData = [
      {
        rut: '12345678-9',
        nombres: 'Juan Carlos',
        apellidosPaterno: 'González',
        apellidosMaterno: 'López',
        curso: 'III°M',
        correoApoderado: 'apoderado1@email.com'
      },
      {
        rut: '98765432-1',
        nombres: 'María José',
        apellidosPaterno: 'Rodríguez',
        apellidosMaterno: 'Silva',
        curso: 'IV°H',
        correoApoderado: 'apoderado2@email.com'
      },
      {
        rut: '11223344-5',
        nombres: 'Pedro Antonio',
        apellidosPaterno: 'Martínez',
        apellidosMaterno: 'Vargas',
        curso: 'II°M',
        correoApoderado: 'apoderado3@email.com'
      }
    ];

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // RUT
      { wch: 20 }, // Nombres
      { wch: 20 }, // Apellido Paterno
      { wch: 20 }, // Apellido Materno
      { wch: 10 }, // Curso
      { wch: 30 }  // Correo Apoderado
    ];
    worksheet['!cols'] = columnWidths;

    // Agregar el worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Estudiantes');

    // Generar y descargar el archivo
    XLSX.writeFile(workbook, 'plantilla_estudiantes.xlsx');
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

  // Promoción masiva de cursos
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState(null);

  // Marcar/desmarcar repitente
  const handleToggleRepitente = async (studentId, currentRepite) => {
    try {
      await axios.put(`${API_BASE_URL}/api/students/${studentId}`, 
        { repite: !currentRepite }, 
        { withCredentials: true }
      );
      setSuccess(`Estudiante ${currentRepite ? 'desmarcado' : 'marcado'} como repitente exitosamente`);
      fetchStudents();
      if (showRepitentes) {
        fetchRepitentes();
      }
    } catch (error) {
      setError('Error al actualizar estado de repitente: ' + (error.response?.data?.message || error.message));
    }
  };

  // Promoción individual de un estudiante
  const handlePromoteIndividual = async (studentId, currentCourse) => {
    if (!window.confirm(`¿Estás seguro de que quieres promover a este estudiante del curso ${currentCourse}?`)) {
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/students/${studentId}/promote`, {}, { withCredentials: true });
      setSuccess(response.data.message);
      fetchStudents();
      if (showRepitentes) {
        fetchRepitentes();
      }
    } catch (error) {
      setError('Error al promover estudiante: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePromoteStudents = async () => {
    if (!window.confirm('¿Estás seguro de que quieres promover a todos los estudiantes al siguiente curso? Esta acción no se puede deshacer.')) {
      return;
    }

    setPromoting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/students/promote`, {}, { withCredentials: true });
      setPromotionResult(response.data);
      setSuccess('Promoción de cursos completada exitosamente');
      fetchStudents(); // Recargar la lista de estudiantes
      setShowPromotionModal(false);
    } catch (error) {
      setError('Error al realizar la promoción: ' + (error.response?.data?.message || error.message));
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1>Gestión de Estudiantes</h1>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          {/* Botones de alternancia entre activos, repitentes y egresados */}
          <Row className="mb-3">
            <Col>
              <div className="btn-group" role="group">
                <Button
                  variant={!showEgresados && !showRepitentes ? "primary" : "outline-primary"}
                  onClick={() => {
                    setShowEgresados(false);
                    setShowRepitentes(false);
                  }}
                >
                  <i className="fas fa-users me-2"></i>
                  Estudiantes Activos ({students.length})
                </Button>
                <Button
                  variant={showRepitentes ? "primary" : "outline-primary"}
                  onClick={() => {
                    setShowEgresados(false);
                    setShowRepitentes(true);
                  }}
                >
                  <i className="fas fa-redo me-2"></i>
                  Repitentes ({repitentes.length})
                </Button>
                <Button
                  variant={showEgresados ? "primary" : "outline-primary"}
                  onClick={() => {
                    setShowEgresados(true);
                    setShowRepitentes(false);
                  }}
                >
                  <i className="fas fa-graduation-cap me-2"></i>
                  Egresados ({egresados.length})
                </Button>
              </div>
            </Col>
          </Row>
          
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
              <div className="d-flex gap-2 justify-content-end align-items-end">
                <Button 
                  variant="outline-primary" 
                  onClick={handleDownloadTemplate}
                  title="Descargar Plantilla Excel"
                  style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ⬇️
                </Button>
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
                }}>
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
                <Button 
                  variant="warning" 
                  onClick={() => setShowPromotionModal(true)}
                  title="Promover todos los estudiantes al siguiente curso"
                >
                  <i className="fas fa-graduation-cap me-2"></i>
                  Pasar de Curso
                </Button>
              </div>
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
              <th>{showEgresados ? 'Último Curso' : 'Curso'}</th>
              <th>Correo Apoderado</th>
              {showEgresados && <th>Año Egreso</th>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(showEgresados ? egresados : showRepitentes ? repitentes : filteredStudents).map((student) => (
              <tr key={student._id}>
                <td>{student.rut}</td>
                <td>{`${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className={student.repite ? "text-warning fw-bold" : ""}>
                      {student.curso}
                    </span>
                    {!showEgresados && student.repite && (
                      <span className="badge bg-warning ms-2">
                        <i className="fas fa-redo me-1"></i>
                        Repitente
                      </span>
                    )}
                  </div>
                </td>
                <td>{student.correoApoderado}</td>
                {showEgresados && (
                  <td>
                    <span className="badge bg-success">
                      {student.añoEgreso || 'N/A'}
                    </span>
                  </td>
                )}
                <td>
                  {!showEgresados ? (
                    <>
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
                        variant={student.repite ? "outline-warning" : "outline-secondary"}
                        size="sm"
                        className="me-2"
                        onClick={() => handleToggleRepitente(student._id, student.repite)}
                        title={student.repite ? "Desmarcar como repitente" : "Marcar como repitente"}
                      >
                        <i className={`fas ${student.repite ? "fa-check" : "fa-redo"}`}></i>
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-2"
                        onClick={() => handlePromoteIndividual(student._id, student.curso)}
                        title="Promover individualmente al siguiente curso"
                        disabled={student.repite}
                      >
                        <i className="fas fa-arrow-up"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteStudent(student._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted">Solo lectura</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal para crear/editar estudiante */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        centered
        dialogClassName="modal-dialog-centered"
        style={{ marginTop: '5vh' }}
      >
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

      {/* Modal de confirmación para promoción de cursos */}
      <Modal 
        show={showPromotionModal} 
        onHide={() => setShowPromotionModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-graduation-cap me-2 text-warning"></i>
            Promoción Masiva de Cursos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>¡Atención!</strong> Esta acción promoverá a TODOS los estudiantes al siguiente curso.
          </div>
          
          <h6>Reglas de Promoción:</h6>
          <ul className="list-unstyled">
            <li><strong>PRE-K</strong> → <strong>kinder</strong></li>
            <li><strong>kinder</strong> → <strong>1°A</strong></li>
            <li><strong>1°A</strong> → <strong>2°A</strong></li>
            <li><strong>2°A</strong> → <strong>3°A</strong></li>
            <li><strong>3°A</strong> → <strong>4°A</strong></li>
            <li><strong>4°A</strong> → <strong>5°A</strong></li>
            <li><strong>5°A</strong> → <strong>6°A</strong></li>
            <li><strong>6°A</strong> → <strong>7°A</strong></li>
            <li><strong>7°A</strong> → <strong>8°A</strong></li>
            <li><strong>8°A</strong> → <strong>I°M</strong></li>
            <li><strong>I°M</strong> → <strong>II°M</strong></li>
            <li><strong>II°M</strong> → <strong>III°M</strong></li>
            <li><strong>III°M</strong> → <strong>IV°M</strong></li>
            <li><strong>IV°M</strong> → <em>Egresado del sistema</em></li>
          </ul>
          
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Nota:</strong> Los estudiantes de IV°M serán marcados como egresados y se moverán a la pestaña "Egresados".
          </div>
          
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Repitentes:</strong> Los estudiantes marcados como repitentes NO se promoverán automáticamente y mantendrán su curso actual.
          </div>
          
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Total de estudiantes:</strong> {students.length}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPromotionModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="warning" 
            onClick={handlePromoteStudents}
            disabled={promoting}
          >
            {promoting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Procesando...
              </>
            ) : (
              <>
                <i className="fas fa-graduation-cap me-2"></i>
                Confirmar Promoción
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentManagement;