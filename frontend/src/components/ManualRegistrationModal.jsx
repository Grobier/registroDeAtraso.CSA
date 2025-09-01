import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaWifi, FaClock, FaUser, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';

const ManualRegistrationModal = ({ show, onHide, onSave, courses }) => {
  const [formData, setFormData] = useState({
    curso: '',
    estudiante: '',
    motivo: '',
    hora: '',
    trajoCertificado: false,
    observaciones: ''
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Obtener hora actual
  useEffect(() => {
    const now = new Date();
    const horaActual = now.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    setFormData(prev => ({ ...prev, hora: horaActual }));
  }, []);

  // Cargar estudiantes cuando se selecciona un curso
  useEffect(() => {
    if (formData.curso) {
      setLoadingStudents(true);
      setStudents([]);
      
      // Simular carga de estudiantes (en un caso real, harías una llamada a la API)
      // Por ahora, vamos a usar una lista de estudiantes de ejemplo
      const estudiantesEjemplo = [
        { _id: '1', nombres: 'Juan', apellidosPaterno: 'Pérez', apellidosMaterno: 'González', rut: '12345678-9', curso: formData.curso },
        { _id: '2', nombres: 'María', apellidosPaterno: 'López', apellidosMaterno: 'Martínez', rut: '98765432-1', curso: formData.curso },
        { _id: '3', nombres: 'Carlos', apellidosPaterno: 'García', apellidosMaterno: 'Rodríguez', rut: '11223344-5', curso: formData.curso },
        { _id: '4', nombres: 'Ana', apellidosPaterno: 'Hernández', apellidosMaterno: 'Sánchez', rut: '55667788-9', curso: formData.curso },
        { _id: '5', nombres: 'Luis', apellidosPaterno: 'Torres', apellidosMaterno: 'Flores', rut: '99887766-5', curso: formData.curso }
      ];
      
      setTimeout(() => {
        setStudents(estudiantesEjemplo);
        setLoadingStudents(false);
      }, 500);
    } else {
      setStudents([]);
    }
  }, [formData.curso]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.curso || !formData.estudiante || !formData.motivo || !formData.hora) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const atrasoManual = {
      id: Date.now(), // ID único temporal
      ...formData,
      timestamp: new Date().toISOString(),
      sincronizado: false,
      tipo: 'manual'
    };

    onSave(atrasoManual);
    onHide();
    
    // Limpiar formulario
    setFormData({
      curso: '',
      estudiante: '',
      motivo: '',
      hora: '',
      trajoCertificado: false,
      observaciones: ''
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>
          <FaExclamationTriangle className="me-2" />
          Registro Manual de Atraso
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Sin conexión a internet</strong><br />
          Complete el formulario para registrar el atraso manualmente.
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-1" />
                  Curso *
                </Form.Label>
                <Form.Select 
                  name="curso" 
                  value={formData.curso} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un curso</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-1" />
                  Estudiante *
                </Form.Label>
                <Form.Select 
                  name="estudiante" 
                  value={formData.estudiante} 
                  onChange={handleChange}
                  required
                  disabled={!formData.curso || loadingStudents}
                >
                  <option value="">
                    {loadingStudents ? 'Cargando estudiantes...' : 'Seleccione un estudiante'}
                  </option>
                  {students.map((student) => (
                    <option key={student._id} value={`${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno} (${student.rut})`}>
                      {student.nombres} {student.apellidosPaterno} {student.apellidosMaterno} - {student.rut}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaClock className="me-1" />
                  Hora de Llegada *
                </Form.Label>
                <Form.Control
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Motivo *</Form.Label>
                <Form.Select name="motivo" value={formData.motivo} onChange={handleChange} required>
                  <option value="">Selecciona un motivo</option>
                  <option value="Retraso en transporte">Retraso en transporte</option>
                  <option value="Dificultades familiares imprevistas">Dificultades familiares imprevistas</option>
                  <option value="Problemas de salud">Problemas de salud</option>
                  <option value="Condiciones meteorológicas adversas">Condiciones meteorológicas adversas</option>
                  <option value="Despertar tardío">Despertar tardío</option>
                  <option value="Tráfico">Tráfico</option>
                  <option value="Fallas en el transporte público">Fallas en el transporte público</option>
                  <option value="Accidente en el trayecto">Accidente en el trayecto</option>
                  <option value="Emergencia personal">Emergencia personal</option>
                  <option value="Se niega a entregar un motivo">Se niega a entregar un motivo</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="trajoCertificado"
              checked={formData.trajoCertificado}
              onChange={handleChange}
              label="El estudiante trajo certificado médico"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FaFileAlt className="me-1" />
              Observaciones Adicionales
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Cualquier información adicional relevante..."
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="warning" onClick={handleSubmit}>
          <FaExclamationTriangle className="me-1" />
          Registrar Manualmente
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManualRegistrationModal;
