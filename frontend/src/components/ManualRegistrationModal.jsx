import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaWifi, FaClock, FaUser, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';
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
  const firstInputRef = useRef(null);

  // Obtener hora actual
  useEffect(() => {
    const now = new Date();
    const horaActual = now.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false  // Usar formato 24 horas para compatibilidad con input time
    });
    setFormData(prev => ({ ...prev, hora: horaActual }));
  }, []);

  // Manejar foco y accesibilidad cuando el modal se abre
  useEffect(() => {
    if (show) {
      // Función para corregir aria-hidden
      const fixAriaHidden = () => {
        const modalElement = document.querySelector('.modal.show[aria-hidden="true"]');
        if (modalElement) {
          modalElement.removeAttribute('aria-hidden');
        }
      };

      // Pequeño delay para asegurar que el modal esté completamente renderizado
      const timer = setTimeout(() => {
        fixAriaHidden();
        
        // Enfocar el primer campo
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);

      // Observer para detectar cambios en el DOM y corregir aria-hidden automáticamente
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            const target = mutation.target;
            if (target.classList.contains('modal') && target.classList.contains('show') && target.getAttribute('aria-hidden') === 'true') {
              target.removeAttribute('aria-hidden');
            }
          }
        });
      });

      // Observar cambios en el modal
      const modalElement = document.querySelector('.modal');
      if (modalElement) {
        observer.observe(modalElement, { attributes: true, attributeFilter: ['aria-hidden'] });
      }
      
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
  }, [show]);

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
      Swal.fire({
        title: 'Campos Incompletos',
        text: 'Por favor complete todos los campos obligatorios',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Cerrar el modal inmediatamente
    onHide();
    
    // Mostrar confirmación después de cerrar el modal
    Swal.fire({
      title: '¿Confirmar Registro Manual?',
      html: `
        <div class="text-start">
          <p><strong>Estudiante:</strong> ${formData.estudiante}</p>
          <p><strong>Curso:</strong> ${formData.curso}</p>
          <p><strong>Hora:</strong> ${formData.hora}</p>
          <p><strong>Motivo:</strong> ${formData.motivo}</p>
          <p><strong>Certificado:</strong> ${formData.trajoCertificado ? 'Sí' : 'No'}</p>
          ${formData.observaciones ? `<p><strong>Observaciones:</strong> ${formData.observaciones}</p>` : ''}
        </div>
        <hr>
        <p class="text-info"><strong>ℹ️ Este registro se enviará inmediatamente al servidor</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar manualmente',
      cancelButtonText: 'Cancelar',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Proceder con el registro
        const atrasoManual = {
          ...formData,
          timestamp: new Date().toISOString()
        };

        onSave(atrasoManual);
        
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
      } else {
        // Si cancela, volver a abrir el modal
        onHide();
        setTimeout(() => {
          // Reabrir el modal después de un pequeño delay
          // Esto se maneja desde el componente padre
        }, 100);
      }
    });
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      aria-labelledby="manual-registration-title"
      aria-describedby="manual-registration-description"
    >
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title id="manual-registration-title">
          <FaExclamationTriangle className="me-2" />
          Registro Manual de Atraso
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="info" className="mb-4" id="manual-registration-description">
          <FaExclamationTriangle className="me-2" />
          <strong>Registro Manual de Atraso</strong><br />
          Complete el formulario para registrar el atraso con la hora real de llegada.
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
                  ref={firstInputRef}
                  name="curso" 
                  value={formData.curso} 
                  onChange={handleChange}
                  required
                  aria-label="Seleccionar curso del estudiante"
                  aria-describedby="curso-help"
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
                  aria-label="Seleccionar estudiante"
                  aria-describedby="estudiante-help"
                >
                  <option value="">
                    {loadingStudents ? 'Cargando estudiantes...' : 'Seleccione un estudiante'}
                  </option>
                  {students.map((student) => (
                    <option key={student._id} value={student.rut}>
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
                  aria-label="Hora de llegada del estudiante"
                  aria-describedby="hora-help"
                />
              </Form.Group>
            </Col>
            
            <Col lg={9} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Motivo *</Form.Label>
                <Form.Select 
                  name="motivo" 
                  value={formData.motivo} 
                  onChange={handleChange} 
                  required
                  aria-label="Motivo del atraso"
                  aria-describedby="motivo-help"
                >
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
        <Button 
          variant="secondary" 
          onClick={onHide}
          aria-label="Cancelar registro manual"
        >
          Cancelar
        </Button>
        <Button 
          variant="warning" 
          onClick={handleSubmit}
          aria-label="Registrar atraso manualmente"
        >
          <FaExclamationTriangle className="me-1" />
          Registrar Manualmente
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManualRegistrationModal;
