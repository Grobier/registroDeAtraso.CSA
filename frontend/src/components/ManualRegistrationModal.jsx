import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaWifi, FaClock, FaUser, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const ManualRegistrationModal = ({ show, onHide, onSave, courses }) => {
  const [formData, setFormData] = useState({
    curso: '',
    estudiante: '',
    motivo: '',
    hora: '',
    trajoCertificado: false,
    certificadoAdjunto: null,
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
      
      // Hacer llamada real a la API para obtener estudiantes del curso
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');
      
      axios.get(`${API_BASE_URL}/api/students`, { 
        params: { curso: formData.curso }, 
        withCredentials: true 
      })
      .then(response => {
        console.log('🔍 [DEBUG] Estudiantes recibidos para curso:', formData.curso, response.data);
        setStudents(response.data);
        setLoadingStudents(false);
      })
      .catch(error => {
        console.error('❌ [DEBUG] Error al obtener estudiantes:', error);
        setStudents([]);
        setLoadingStudents(false);
      });
    } else {
      setStudents([]);
    }
  }, [formData.curso]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      certificadoAdjunto: null,
      observaciones: ''
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
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
            <Col lg={4} md={6}>
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
            
            <Col lg={8} md={6}>
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
            <Col lg={3} md={6}>
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
            
            <Col lg={9} md={6}>
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

          {formData.trajoCertificado && (
            <Form.Group className="mb-3">
              <Form.Label>Adjuntar Certificado Médico</Form.Label>
              <Form.Control
                type="file"
                name="certificadoAdjunto"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="input-modern"
              />
              <Form.Text className="text-muted">
                Formatos aceptados: PDF, JPG, PNG, DOC, DOCX. Máximo 5MB.
              </Form.Text>
            </Form.Group>
          )}

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
