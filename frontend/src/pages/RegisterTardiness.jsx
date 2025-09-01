// src/pages/RegisterTardiness.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlusCircle } from 'react-icons/fa';
import './RegisterTardiness.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

const RegisterTardiness = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({ 
    motivo: '',
    trajoCertificado: false,
    certificadoAdjunto: null
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [requiresCertificate, setRequiresCertificate] = useState(false);

  // Obtener la lista de cursos
  useEffect(() => {
    console.log('🔍 [DEBUG] RegisterTardiness - Cargando cursos');
    console.log('🔍 [DEBUG] API_BASE_URL:', API_BASE_URL);
    console.log('🔍 [DEBUG] URL completa:', `${API_BASE_URL}/api/students/curso`);
    
    axios.get(`${API_BASE_URL}/api/students/curso`, { withCredentials: true })
      .then(response => {
        console.log('🔍 [DEBUG] Cursos recibidos:', response.data);
        console.log('🔍 [DEBUG] Cantidad de cursos:', response.data.length);
        setCourses(response.data);
      })
      .catch(err => {
        console.error("❌ [DEBUG] Error al obtener cursos:", err);
        console.error("❌ [DEBUG] Error response:", err.response);
      });
  }, []);

  // Cargar estudiantes al seleccionar un curso
  useEffect(() => {
    if (selectedCourse) {
      console.log('🔍 [DEBUG] RegisterTardiness - Cargando estudiantes para curso:', selectedCourse);
      setStudents([]);
      axios.get(`${API_BASE_URL}/api/students`, { params: { curso: selectedCourse }, withCredentials: true })
        .then(response => {
          console.log('🔍 [DEBUG] Estudiantes recibidos:', response.data);
          console.log('🔍 [DEBUG] Cantidad de estudiantes:', response.data.length);
          setStudents(response.data);
        })
        .catch(err => {
          console.error("❌ [DEBUG] Error al obtener estudiantes:", err);
          console.error("❌ [DEBUG] Error response:", err.response);
          setStudents([]);
        });
    } else {
      setStudents([]);
    }
  }, [selectedCourse]);

  // Actualizar hora cada minuto y determinar si requiere certificado
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const minutosDesdeMedianoche = currentHour * 60 + currentMinute;
      const limiteMinutos = 9 * 60 + 30; // 9:30 AM
      
      setRequiresCertificate(minutosDesdeMedianoche > limiteMinutos);
    }, 60000); // Actualizar cada minuto

    // Actualizar inmediatamente
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const minutosDesdeMedianoche = currentHour * 60 + currentMinute;
    const limiteMinutos = 9 * 60 + 30;
    setRequiresCertificate(minutosDesdeMedianoche > limiteMinutos);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar que si requiere certificado, debe estar marcado y adjuntado
    if (requiresCertificate && !formData.trajoCertificado) {
      Swal.fire({
        title: 'Certificado Médico Requerido',
        text: 'Después de las 9:30 AM es obligatorio presentar certificado médico para justificar el atraso.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (requiresCertificate && formData.trajoCertificado && !formData.certificadoAdjunto) {
      Swal.fire({
        title: 'Archivo Requerido',
        text: 'Debe adjuntar el archivo del certificado médico.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Si no trajo certificado, mostrar confirmación
    if (requiresCertificate && !formData.trajoCertificado) {
      Swal.fire({
        title: 'Confirmar Registro Sin Certificado',
        text: 'El estudiante será registrado como "atrasado" y NO contará como presente. ¿Desea continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, registrar sin certificado',
        cancelButtonText: 'Cancelar y adjuntar certificado'
      }).then((result) => {
        if (result.isConfirmed) {
          procederConRegistro();
        }
      });
      return;
    }

    // Si trajo certificado o no requiere certificado, proceder directamente
    procederConRegistro();
  };

  const procederConRegistro = () => {
    Swal.fire({
      title: '¿Está seguro que quiere registrar el atraso?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsLoading(true);

        console.log('🔍 [DEBUG] Enviando datos del atraso:');
        console.log('🔍 [DEBUG] API_BASE_URL:', API_BASE_URL);
        console.log('🔍 [DEBUG] URL completa:', `${API_BASE_URL}/api/tardiness`);
        console.log('🔍 [DEBUG] Datos a enviar:', {
          ...formData,
          rut: selectedStudent,
          curso: selectedCourse
        });
        
        // Crear FormData para enviar archivos
        const formDataToSend = new FormData();
        formDataToSend.append('motivo', formData.motivo);
        formDataToSend.append('rut', selectedStudent);
        formDataToSend.append('curso', selectedCourse);
        formDataToSend.append('trajoCertificado', formData.trajoCertificado);
        
        if (formData.certificadoAdjunto) {
          formDataToSend.append('certificadoAdjunto', formData.certificadoAdjunto);
        }

        axios.post(`${API_BASE_URL}/api/tardiness`, formDataToSend, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
          .then(response => {
            setIsLoading(false);
            setMessage(response.data.message);
            Swal.fire({
              title: '¡Registrado!',
              icon: 'success',
              timer: 4000,
              html: `
                <div class="text-start">
                  <p class="mb-2">${response.data.message}</p>
                  <hr>
                  <p class="mb-1"><strong>Concepto:</strong> 
                    <span class="badge ${
                      response.data.concepto === 'presente' ? 'bg-success' : 
                      response.data.concepto === 'atrasado-presente' ? 'bg-warning' : 
                      'bg-danger'
                    }">
                      ${
                        response.data.concepto === 'presente' ? 'Presente' : 
                        response.data.concepto === 'atrasado-presente' ? 'Atrasado-Presente' : 
                        'Ausente'
                      }
                    </span>
                  </p>
                  ${response.data.requiereCertificado ? 
                    `<p class="mb-1"><strong>Certificado:</strong> 
                      <span class="badge ${response.data.trajoCertificado ? 'bg-success' : 'bg-danger'}">
                        ${response.data.trajoCertificado ? 'Presentado ✓' : 'No presentado ✗'}
                      </span>
                    </p>` 
                    : '<p class="mb-1 text-muted"><em>No se requiere certificado antes de las 9:30 AM</em></p>'
                  }
                  <p class="mb-0 mt-2"><small class="text-muted">
                    ${response.data.concepto === 'atrasado-asistido' 
                      ? 'El estudiante será contabilizado como presente' 
                      : 'El estudiante será contabilizado como ausente'
                    }
                  </small></p>
                </div>
              `,
              showConfirmButton: false
            });

            setFormData({ 
              motivo: '',
              trajoCertificado: false,
              certificadoAdjunto: null
            });
            setSelectedStudent('');
            setSelectedCourse('');
          })
          .catch(error => {
            setIsLoading(false);
            console.error("Error al registrar atraso:", error);
            setMessage('Error al registrar atraso');
            Swal.fire({
              title: 'Error',
              text: 'Error al registrar el atraso',
              icon: 'error'
            });
          });
      }
    });
  };

  return (
    <div className="register-tardiness-bg d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="register-tardiness-card animate__fadeIn">
        <div className="text-center mb-4">
          <FaPlusCircle size={38} color="#1a73e8" style={{ marginBottom: '-7px', marginRight: '8px' }} />
          <span className="register-tardiness-title">Registrar Atraso</span>
          
          {/* Indicador de hora actual */}
          <div className="mt-3">
            <div className={`badge ${requiresCertificate ? 'bg-warning' : 'bg-success'} fs-6`}>
              <i className="fas fa-clock me-2"></i>
              Hora actual: {currentTime.toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="mt-2">
              <small className={`text-${requiresCertificate ? 'warning' : 'success'}`}>
                {requiresCertificate 
                  ? '⚠️ Después de las 9:30 AM - Certificado médico OBLIGATORIO' 
                  : '✅ Antes de las 9:30 AM - No se requiere certificado médico'
                }
              </small>
            </div>
          </div>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Curso</Form.Label>
            <Form.Select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSelectedStudent(''); }} className="input-modern">
              <option value="">Seleccione un curso</option>
              {courses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Estudiante</Form.Label>
            <Form.Select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-modern">
              <option value="">Seleccione un estudiante</option>
              {students.map((student) => (
                <option key={student._id} value={student.rut}>{student.nombres} {student.apellidosPaterno} {student.apellidosMaterno}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Motivo</Form.Label>
            <Form.Select name="motivo" value={formData.motivo} onChange={handleChange} className="input-modern">
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

          {/* Sección de Certificado Médico */}
          <div className={`mb-4 p-3 border rounded ${requiresCertificate ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light'}`}>
            <h6 className="mb-3">
              <i className="fas fa-stethoscope me-2"></i>
              Certificado Médico
              {requiresCertificate && (
                <span className="badge bg-warning ms-2">OBLIGATORIO</span>
              )}
            </h6>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="trajoCertificado"
                checked={formData.trajoCertificado}
                onChange={handleChange}
                label="El estudiante trajo certificado médico"
                className="mb-2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="noTrajoCertificado"
                checked={!formData.trajoCertificado}
                onChange={(e) => setFormData({ ...formData, trajoCertificado: !e.target.checked, certificadoAdjunto: null })}
                label="El estudiante NO trajo certificado médico"
                className="mb-2"
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

            <div className={`alert ${requiresCertificate ? 'alert-warning' : 'alert-info'}`}>
              <small>
                {requiresCertificate ? (
                  <>
                    <strong>⚠️ ATENCIÓN:</strong> Después de las 9:30 AM es <strong>OBLIGATORIO</strong> presentar certificado médico. 
                    Sin certificado, el estudiante será registrado como "atrasado" y no contará como presente.
                  </>
                ) : (
                  <>
                    <strong>✅ INFORMACIÓN:</strong> Antes de las 9:30 AM no se requiere certificado médico. 
                    El estudiante será registrado como "atrasado-asistido" y contará como presente.
                  </>
                )}
              </small>
            </div>
          </div>
          <div className="d-grid">
            <Button type="submit" className="register-btn-modern" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </>
              ) : 'Registrar'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RegisterTardiness;


