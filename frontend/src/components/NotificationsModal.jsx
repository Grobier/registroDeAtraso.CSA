// src/components/NotificationsModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

const NotificationsModal = ({ show, onHide }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterConcepto, setFilterConcepto] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  
  // Filtrar estudiantes según el concepto seleccionado
  const filteredStudents = filterConcepto 
    ? students.filter(student => student.atrasos?.[0]?.concepto === filterConcepto)
    : students;

  // Limpiar selección cuando cambia el filtro
  useEffect(() => {
    setSelectedStudents([]);
  }, [filterConcepto]);
  
  const [emailForm, setEmailForm] = useState({
    asunto: 'Notificación de Atrasos - Estudiante',
    contenido: `Estimado apoderado,

Le informamos que su pupilo(a) {NOMBRE_ESTUDIANTE} del curso {CURSO} ha acumulado {TOTAL_ATRASOS} atraso(s) durante el período escolar.

Detalle de atrasos:
{DETALLE_ATRASOS}

Es importante que tome las medidas necesarias para evitar futuros atrasos, ya que esto puede afectar el rendimiento académico del estudiante.

Atentamente,
Equipo Directivo`
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar estudiantes con atrasos
  useEffect(() => {
    console.log('🔍 NotificationsModal useEffect - show:', show);
    if (show) {
      console.log('📡 Iniciando carga de estudiantes con atrasos...');
      loadStudentsWithTardiness();
    }
  }, [show]);

  const loadStudentsWithTardiness = async () => {
    console.log('🚀 loadStudentsWithTardiness iniciada');
    console.log('🔗 API_BASE_URL:', API_BASE_URL);
    console.log('🌐 URL completa:', `${API_BASE_URL}/api/notifications/students-with-tardiness`);
    
    setLoading(true);
    try {
      console.log('📡 Haciendo petición a la API...');
      const response = await axios.get(`${API_BASE_URL}/api/notifications/students-with-tardiness`, {
        withCredentials: true
      });
      
      console.log('✅ Respuesta recibida:', response.data);
      console.log('📊 Total de estudiantes:', response.data.length);
      
      if (response.data.length > 0) {
        console.log('🔍 Primer estudiante:', response.data[0]);
        if (response.data[0].atrasos && response.data[0].atrasos.length > 0) {
          console.log('📋 Primer atraso:', response.data[0].atrasos[0]);
          console.log('🏷️ Concepto:', response.data[0].atrasos[0].concepto);
          console.log('📄 Certificado:', response.data[0].atrasos[0].trajoCertificado);
        }
      }
      
      setStudents(response.data);
      // NO seleccionar automáticamente - usuario debe seleccionar manualmente
      setSelectedStudents([]);
      console.log('💾 Estado actualizado con estudiantes');
    } catch (error) {
      console.error('❌ Error en loadStudentsWithTardiness:', error);
      setMessage({ type: 'danger', text: 'Error de conexión' });
    } finally {
      setLoading(false);
      console.log('🏁 loadStudentsWithTardiness completada');
    }
  };

  const handleStudentSelection = (rut, checked) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, rut]);
    } else {
      setSelectedStudents(selectedStudents.filter(s => s !== rut));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.rut));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleShowDetails = (student) => {
    setSelectedStudentDetails(student);
    setShowDetailsModal(true);
  };

  const handleSendEmails = async () => {
    if (selectedStudents.length === 0) {
      setMessage({ type: 'warning', text: 'Debe seleccionar al menos un estudiante' });
      return;
    }

    if (!emailForm.asunto.trim() || !emailForm.contenido.trim()) {
      setMessage({ type: 'warning', text: 'Debe completar el asunto y contenido del correo' });
      return;
    }

    setSending(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/notifications/send-emails`, {
        asunto: emailForm.asunto,
        contenido: emailForm.contenido,
        estudiantesSeleccionados: selectedStudents
      }, { withCredentials: true });

      const data = response.data;

      // Contar conceptos de los estudiantes seleccionados
      const conceptosCount = {};
      selectedStudents.forEach(rut => {
        const student = students.find(s => s.rut === rut);
        if (student?.atrasos?.[0]?.concepto) {
          const concepto = student.atrasos[0].concepto;
          conceptosCount[concepto] = (conceptosCount[concepto] || 0) + 1;
        }
      });

      const conceptosText = Object.entries(conceptosCount)
        .map(([concepto, count]) => {
          const label = concepto === 'atrasado-asistido' ? 'Atrasado-Presente' : 'Atrasado-No Presente';
          return `${count} ${label}`;
        })
        .join(', ');

      setMessage({ 
        type: 'success', 
        text: `Correos enviados exitosamente. ${data.enviados} enviados, ${data.fallidos} fallidos. Conceptos: ${conceptosText}` 
      });
      
      // Limpiar formulario
      setEmailForm({
        asunto: 'Notificación de Atrasos - Estudiante',
        contenido: `Estimado apoderado,

Le informamos que su pupilo(a) {NOMBRE_ESTUDIANTE} del curso {CURSO} ha acumulado {TOTAL_ATRASOS} atraso(s) durante el período escolar.

Detalle de atrasos:
{DETALLE_ATRASOS}

Es importante que tome las medidas necesarias para evitar futuros atrasos, ya que esto puede afectar el rendimiento académico del estudiante.

Atentamente,
Equipo Directivo`
      });
      
      // Recargar estudiantes
      setTimeout(() => {
        loadStudentsWithTardiness();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error de conexión al enviar correos' });
    } finally {
      setSending(false);
    }
  };

  const getTardinessColor = (count) => {
    if (count >= 5) return 'danger';
    if (count >= 3) return 'warning';
    return 'info';
  };

  // Función para obtener el color del badge según el concepto
  const getConceptoColor = (concepto) => {
    console.log('🎨 getConceptoColor llamado con:', concepto);
    const color = (() => {
      switch (concepto) {
        case 'atrasado-asistido':
          return 'success'; // Verde - cuenta como presente
        case 'atrasado':
          return 'warning'; // Amarillo - no cuenta como presente
        default:
          return 'secondary';
      }
    })();
    console.log('🎨 Color asignado:', color);
    return color;
  };

  // Función para obtener la etiqueta del concepto
  const getConceptoLabel = (concepto) => {
    console.log('🏷️ getConceptoLabel llamado con:', concepto);
    const label = (() => {
      switch (concepto) {
        case 'atrasado-asistido':
          return 'Atrasado-Presente';
        case 'atrasado':
          return 'Atrasado-No Presente';
        default:
          return concepto || 'Atrasado';
      }
    })();
    console.log('🏷️ Etiqueta asignada:', label);
    return label;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>📧 Notificaciones por Correo a Apoderados</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Alert de confirmación */}
        <Alert variant="success" className="mb-3">
          <strong>🎉 ¡MODAL FUNCIONANDO!</strong> Show: {show.toString()} | 
          Estudiantes: {students.length} | 
          Loading: {loading.toString()}
        </Alert>
        
        {/* Logs de debug */}
        {console.log('🎨 Renderizando NotificationsModal - show:', show)}
        {console.log('📊 Estado actual:', { 
          students: students.length, 
          loading, 
          filterConcepto,
          filteredStudents: filteredStudents.length 
        })}
        
        {message.text && (
          <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        {/* Debug Info */}
        <div className="alert alert-info mb-3">
          <strong>🔍 DEBUG:</strong> Modal renderizado - Show: {show.toString()} | 
          Estudiantes: {students.length} | 
          Loading: {loading.toString()} | 
          Filtro: {filterConcepto || 'Ninguno'}
        </div>

        {/* Resumen estadístico */}
        <div className="mb-3">
          <div className="row">
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h6 className="card-title">Atrasado-Presente</h6>
                  <h4>{students.filter(s => s.atrasos?.[0]?.concepto === 'atrasado-asistido').length}</h4>
                  <small>Cuentan como asistencia</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-warning text-dark">
                <div className="card-body text-center">
                  <h6 className="card-title">Atrasado-No Presente</h6>
                  <h4>{students.filter(s => s.atrasos?.[0]?.concepto === 'atrasado').length}</h4>
                  <small>No cuentan como asistencia</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h6 className="card-title">Total Estudiantes</h6>
                  <h4>{students.length}</h4>
                  <small>Con atrasos registrados</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-3">
          <div className="row align-items-end">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Filtrar por Concepto</Form.Label>
                <Form.Select 
                  value={filterConcepto} 
                  onChange={(e) => setFilterConcepto(e.target.value)}
                >
                  <option value="">Todos los conceptos</option>
                  <option value="atrasado-asistido">Atrasado-Presente</option>
                  <option value="atrasado">Atrasado-No Presente</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => setFilterConcepto('')}
                disabled={!filterConcepto}
              >
                Limpiar Filtro
              </Button>
            </div>
            <div className="col-md-4 text-end">
              <small className="text-muted">
                Mostrando {filteredStudents.length} de {students.length} estudiantes
              </small>
            </div>
          </div>
        </div>

        {/* Lista de estudiantes con atrasos */}
        <div className="mb-4">
          <h5>Estudiantes con Atrasos (Ordenados por cantidad)</h5>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>
                      <Form.Check
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>RUT</th>
                    <th>Nombre Completo</th>
                    <th>Curso</th>
                    <th>Email Apoderado</th>
                    <th>Total Atrasos</th>
                    <th>Concepto Último Atraso</th>
                    <th>Último Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.rut}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedStudents.includes(student.rut)}
                          onChange={(e) => handleStudentSelection(student.rut, e.target.checked)}
                        />
                      </td>
                      <td>{student.rut}</td>
                      <td>
                        {student.nombres} {student.apellidosPaterno} {student.apellidosMaterno}
                      </td>
                      <td>{student.curso}</td>
                      <td>{student.correoApoderado}</td>
                      <td>
                        <Badge bg={getTardinessColor(student.totalAtrasos)}>
                          {student.totalAtrasos}
                        </Badge>
                      </td>
                      <td>
                        {student.atrasos && student.atrasos.length > 0 ? (
                          <div>
                            <Badge 
                              bg={getConceptoColor(student.atrasos[0].concepto)}
                              className="mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleShowDetails(student)}
                              title="Click para ver todos los conceptos de atrasos"
                            >
                              {getConceptoLabel(student.atrasos[0].concepto)}
                            </Badge>
                            {student.atrasos[0].concepto === 'atrasado' && (
                              <div>
                                <small className="text-muted">
                                  Certificado: {student.atrasos[0].trajoCertificado ? '✓ Sí' : '✗ No'}
                                </small>
                              </div>
                            )}
                            <div>
                              <small className="text-primary" style={{ cursor: 'pointer' }} onClick={() => handleShowDetails(student)}>
                                📋 Ver todos los conceptos
                              </small>
                            </div>
                          </div>
                        ) : (
                          <small className="text-muted">N/A</small>
                        )}
                      </td>
                      <td>
                        {student.atrasos && student.atrasos.length > 0 ? (
                          <small>
                            {new Date(student.atrasos[0].fecha).toLocaleDateString('es-CL')} a las {student.atrasos[0].hora}
                          </small>
                        ) : (
                          <small className="text-muted">N/A</small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          
          {filteredStudents.length === 0 && !loading && (
            <Alert variant="info">
              {filterConcepto 
                ? `No hay estudiantes con concepto "${filterConcepto === 'atrasado-asistido' ? 'Atrasado-Presente' : 'Atrasado-No Presente'}"`
                : 'No hay estudiantes con atrasos registrados.'
              }
            </Alert>
          )}
        </div>

        {/* Formulario de correo */}
        <div className="mb-4">
          <h5>Composición del Correo</h5>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Asunto del Correo</Form.Label>
              <Form.Control
                type="text"
                value={emailForm.asunto}
                onChange={(e) => setEmailForm({ ...emailForm, asunto: e.target.value })}
                placeholder="Asunto del correo"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Contenido del Correo</Form.Label>
              <Form.Control
                as="textarea"
                rows={12}
                value={emailForm.contenido}
                onChange={(e) => setEmailForm({ ...emailForm, contenido: e.target.value })}
                placeholder="Contenido del correo"
              />
              <Form.Text className="text-muted">
                <strong>Variables disponibles:</strong><br/>
                • {`{NOMBRE_ESTUDIANTE}`} - Nombre completo del estudiante<br/>
                • {`{CURSO}`} - Curso del estudiante<br/>
                • {`{TOTAL_ATRASOS}`} - Número total de atrasos<br/>
                • {`{DETALLE_ATRASOS}`} - Lista detallada de atrasos
              </Form.Text>
            </Form.Group>
          </Form>
        </div>

        {/* Resumen */}
        <div className="mb-3">
          <Alert variant="info">
            <strong>Resumen:</strong> Se enviarán correos a {selectedStudents.length} apoderado(s) de estudiantes seleccionados.
          </Alert>
        </div>
      </Modal.Body>

      {/* Modal de Detalles de Conceptos */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            📋 Conceptos de Atrasos - {selectedStudentDetails?.nombres} {selectedStudentDetails?.apellidosPaterno}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudentDetails && (
            <div>
              <div className="mb-3">
                <strong>Estudiante:</strong> {selectedStudentDetails.nombres} {selectedStudentDetails.apellidosPaterno} {selectedStudentDetails.apellidosMaterno}
                <br />
                <strong>Curso:</strong> {selectedStudentDetails.curso}
                <br />
                <strong>RUT:</strong> {selectedStudentDetails.rut}
              </div>
              
              <h6>Historial Completo de Conceptos de Atrasos:</h6>
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Concepto</th>
                      <th>Certificado Médico</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentDetails.atrasos?.map((atraso, index) => (
                      <tr key={index}>
                        <td>{new Date(atraso.fecha).toLocaleDateString('es-CL')}</td>
                        <td>{atraso.hora}</td>
                        <td>
                          <Badge bg={getConceptoColor(atraso.concepto)}>
                            {getConceptoLabel(atraso.concepto)}
                          </Badge>
                        </td>
                        <td>
                          {atraso.concepto === 'atrasado' ? (
                            atraso.trajoCertificado ? (
                              <span className="text-success">✓ Sí</span>
                            ) : (
                              <span className="text-danger">✗ No</span>
                            )
                          ) : (
                            <span className="text-muted">No aplica</span>
                          )}
                        </td>
                        <td>{atraso.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {selectedStudentDetails.atrasos?.length === 0 && (
                <Alert variant="info">No hay atrasos registrados para este estudiante.</Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={sending}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSendEmails} 
          disabled={sending || selectedStudents.length === 0}
        >
          {sending ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Enviando...
            </>
          ) : (
            '📧 Enviar Correos'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationsModal;
