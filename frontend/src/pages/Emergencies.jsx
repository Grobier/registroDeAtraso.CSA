import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';
import '../styles/PageTheme.css';
import './Emergencies.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

const PAIN_ZONES = [
  'Cabeza',
  'Cara',
  'Cuello',
  'Estomago',
  'Genitales',
  'Espalda',
  'Brazo Izquierdo',
  'Brazo Derecho',
  'Pierna Izquierda',
  'Pierna Derecha',
  'Mano Izquierda',
  'Mano Derecha',
  'Pie Izquierdo',
  'Pie Derecho'
];

const ACCIDENT_CAUSES = [
  { value: 'colision-accidental', label: 'Colisión accidental' },
  { value: 'caida', label: 'Caída' },
  { value: 'golpe', label: 'Golpe' },
  { value: 'discusion-golpes', label: 'Discusión a golpes con compañero' },
  { value: 'trayecto', label: 'Trayecto' }
];

const PAIN_ZONE_LABELS = {
  Cabeza: 'la cabeza',
  Cara: 'el rostro',
  Cuello: 'el cuello',
  Estomago: 'el estómago',
  Genitales: 'la zona genital',
  Espalda: 'la espalda',
  'Brazo Izquierdo': 'el brazo izquierdo',
  'Brazo Derecho': 'el brazo derecho',
  'Pierna Izquierda': 'la pierna izquierda',
  'Pierna Derecha': 'la pierna derecha',
  'Mano Izquierda': 'la mano izquierda',
  'Mano Derecha': 'la mano derecha',
  'Pie Izquierdo': 'el pie izquierdo',
  'Pie Derecho': 'el pie derecho'
};

const createDefaultAttention = () => ({
  es_accidente: false,
  es_dolor: false,
  detalle_accidente: {
    tipo: '',
    trayecto_info: ''
  },
  detalle_dolor: {
    zonas: [],
    intensidad: 5
  },
  observaciones_libres: ''
});

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        try {
          const text = await response.text();
          message = text || message;
        } catch {
          // ignore parse errors
        }
      }
      throw new Error(message);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const formatAccidentLabel = (value) => {
  const match = ACCIDENT_CAUSES.find((item) => item.value === value);
  return match ? match.label : '';
};

const formatNaturalList = (items) => {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} y ${items[1]}`;
  }
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
};

const Emergencies = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudentRut, setSelectedStudentRut] = useState('');
  const [attention, setAttention] = useState(createDefaultAttention);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const selectedStudent = useMemo(
    () => students.find((student) => student.rut === selectedStudentRut) || null,
    [students, selectedStudentRut]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedCourse) {
      return students;
    }
    return students.filter((student) => student.curso === selectedCourse);
  }, [students, selectedCourse]);

  const previewValues = useMemo(() => {
    const now = new Date();
    const studentName = selectedStudent
      ? `${selectedStudent.nombres} ${selectedStudent.apellidosPaterno} ${selectedStudent.apellidosMaterno}`.replace(/\s+/g, ' ').trim()
      : 'Nombre del estudiante';

    const accidentType = attention.detalle_accidente.tipo === 'trayecto'
      ? `Trayecto${attention.detalle_accidente.trayecto_info ? ` (${attention.detalle_accidente.trayecto_info})` : ''}`
      : formatAccidentLabel(attention.detalle_accidente.tipo);

    const accidentLine = attention.es_accidente && accidentType
      ? `El estudiante fue atendido por un ${accidentType}.`
      : '';

    const painLine = attention.es_dolor && attention.detalle_dolor.zonas.length > 0
      ? `Presenta un cuadro de dolor localizado en: ${formatNaturalList(attention.detalle_dolor.zonas.map((zone) => PAIN_ZONE_LABELS[zone] || zone.toLowerCase()))}, con una intensidad de ${attention.detalle_dolor.intensidad}/10.`
      : '';

    return {
      studentName,
      course: selectedStudent?.curso || selectedCourse || 'Curso',
      date: now.toLocaleDateString('es-CL'),
      time: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      accidentLine,
      painLine,
      insuranceLine: 'El estudiante cuenta con su seguro correspondiente.',
      observations: attention.observaciones_libres.trim() || 'Sin observaciones adicionales.'
    };
  }, [attention, selectedCourse, selectedStudent]);

  const previewSubject = useMemo(
    () => `Aviso de emergencia enfermería - ${previewValues.studentName}`,
    [previewValues.studentName]
  );

  const previewBody = useMemo(() => {
    const lines = [
      'Estimado apoderado:',
      '',
      `Informamos que el estudiante ${previewValues.studentName}, del curso ${previewValues.course}, fue atendido en enfermería hoy ${previewValues.date} a las ${previewValues.time}.`
    ];

    if (previewValues.accidentLine) {
      lines.push('', previewValues.accidentLine);
    }

    if (previewValues.painLine) {
      lines.push('', previewValues.painLine);
    }

    lines.push(
      '',
      previewValues.insuranceLine,
      '',
      'Observaciones:',
      previewValues.observations,
      '',
      'Según lo conversado telefónicamente, la decisión de retirar al estudiante para trasladarlo a un servicio asistencial queda a su criterio.',
      '',
      'Este correo deja constancia del aviso realizado por el establecimiento.',
      '',
      'Atentamente,',
      'Enfermería - Colegio Saint Arieli'
    );

    return lines.join('\n');
  }, [previewValues]);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchJsonWithTimeout(`${API_BASE_URL}/api/students/curso`, { credentials: 'include' }),
        fetchJsonWithTimeout(`${API_BASE_URL}/api/students`, { credentials: 'include' }),
        fetchJsonWithTimeout(`${API_BASE_URL}/api/emergencies/history`, { credentials: 'include' })
      ]);

      const [coursesResult, studentsResult, historyResult] = results;

      if (coursesResult.status !== 'fulfilled' || studentsResult.status !== 'fulfilled') {
        throw new Error('No se pudo cargar la información principal de emergencias');
      }

      setCourses(coursesResult.value);
      setStudents(studentsResult.value);
      setHistory(historyResult.status === 'fulfilled' ? historyResult.value : []);

      if (historyResult.status !== 'fulfilled') {
        setMessage({
          type: 'warning',
          text: 'La página cargó, pero el historial de emergencias no estuvo disponible. Si acabas de actualizar el código del backend, reinicia el servidor.'
        });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Error al cargar la página de emergencias' });
    } finally {
      setLoading(false);
    }
  };

  const loadDataWithDiagnostics = async () => {
    setLoading(true);
    try {
      const requests = [
        {
          label: 'cursos',
          promise: fetchJsonWithTimeout(`${API_BASE_URL}/api/students/curso`, { credentials: 'include' })
        },
        {
          label: 'estudiantes',
          promise: fetchJsonWithTimeout(`${API_BASE_URL}/api/students`, { credentials: 'include' })
        },
        {
          label: 'historial',
          promise: fetchJsonWithTimeout(`${API_BASE_URL}/api/emergencies/history`, { credentials: 'include' })
        }
      ];

      const results = await Promise.allSettled(requests.map((request) => request.promise));
      const [coursesResult, studentsResult, historyResult] = results;
      const failedMainRequests = [0, 1].flatMap((index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return [];
        }

        const detail = result.reason?.name === 'AbortError'
          ? ' (tiempo de espera agotado)'
          : result.reason?.message
            ? ` (${result.reason.message})`
            : '';

        return [`${requests[index].label}${detail}`];
      });

      if (failedMainRequests.length > 0) {
        throw new Error(`No se pudo cargar la información principal de emergencias: ${failedMainRequests.join(', ')}`);
      }

      setCourses(coursesResult.value);
      setStudents(studentsResult.value);
      setHistory(historyResult.status === 'fulfilled' ? historyResult.value : []);

      if (historyResult.status !== 'fulfilled') {
        setMessage({
          type: 'warning',
          text: 'La página cargó, pero el historial de emergencias no estuvo disponible. Si acabas de actualizar el código del backend, reinicia el servidor.'
        });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Error al cargar la página de emergencias' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataWithDiagnostics();
  }, []);

  useEffect(() => {
    if (selectedStudentRut && !filteredStudents.some((student) => student.rut === selectedStudentRut)) {
      setSelectedStudentRut('');
    }
  }, [filteredStudents, selectedStudentRut]);

  const toggleAttentionType = (type) => {
    setAttention((current) => {
      if (type === 'dolor') {
        const nextEnabled = !current.es_dolor;
        return {
          ...current,
          es_dolor: nextEnabled,
          detalle_dolor: nextEnabled ? current.detalle_dolor : { zonas: [], intensidad: 5 }
        };
      }

      const nextEnabled = !current.es_accidente;
      return {
        ...current,
        es_accidente: nextEnabled,
        detalle_accidente: nextEnabled
          ? current.detalle_accidente
          : { tipo: '', trayecto_info: '' }
      };
    });
  };

  const togglePainZone = (zone) => {
    setAttention((current) => ({
      ...current,
      detalle_dolor: {
        ...current.detalle_dolor,
        zonas: current.detalle_dolor.zonas.includes(zone)
          ? current.detalle_dolor.zonas.filter((item) => item !== zone)
          : [...current.detalle_dolor.zonas, zone]
      }
    }));
  };

  const handleAccidentChange = (value) => {
    setAttention((current) => ({
      ...current,
      detalle_accidente: {
        ...current.detalle_accidente,
        tipo: current.detalle_accidente.tipo === value ? '' : value,
        trayecto_info: value === 'trayecto' ? current.detalle_accidente.trayecto_info : ''
      }
    }));
  };

  const validateAttention = () => {
    if (!selectedStudent) {
      return 'Debes seleccionar un estudiante antes de enviar el aviso.';
    }

    if (!attention.es_accidente && !attention.es_dolor) {
      return 'Debes activar Dolor, Accidente o ambos.';
    }

    if (attention.es_dolor && attention.detalle_dolor.zonas.length === 0) {
      return 'Debes seleccionar al menos una zona del cuerpo para el dolor.';
    }

    if (attention.es_accidente) {
      if (!attention.detalle_accidente.tipo) {
        return 'Debes indicar la causa del accidente.';
      }

      if (attention.detalle_accidente.tipo === 'trayecto' && !attention.detalle_accidente.trayecto_info.trim()) {
        return 'Debes especificar el detalle de trayecto.';
      }
    }

    return '';
  };

  const handleSendEmergency = async () => {
    const validationMessage = validateAttention();
    if (validationMessage) {
      setMessage({ type: 'warning', text: validationMessage });
      return;
    }

    setSending(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/emergencies/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentRut: selectedStudent.rut,
          templateKey: 'atencion-enfermeria',
          templateLabel: attention.es_accidente && attention.es_dolor
            ? 'Accidente y dolor'
            : attention.es_accidente
              ? 'Accidente'
              : 'Dolor',
          subject: previewSubject,
          message: previewBody,
          observations: attention.observaciones_libres,
          atencion: attention
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo enviar el aviso de emergencia');
      }

      setMessage({ type: 'success', text: data.message || 'Aviso enviado correctamente.' });
      setAttention(createDefaultAttention());
      await loadDataWithDiagnostics();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'No se pudo enviar la emergencia.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Container fluid className="page-shell">
      <div className="page-title-block">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h1 className="page-title">Emergencias</h1>
            <p className="page-subtitle">Registro rápido de atenciones de enfermería con evidencia del aviso al apoderado.</p>
          </div>
          <div className="emergency-top-note">🚑 Aviso prioritario para retiro de estudiantes</div>
        </div>
      </div>

      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
        </div>
      ) : (
        <>
          <Row className="g-4 mb-4">
            <Col lg={7}>
              <Card className="section-card emergency-highlight-card h-100">
                <Card.Header>Configurar aviso de emergencia</Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Curso</Form.Label>
                        <Form.Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                          <option value="">Todos los cursos</option>
                          {courses.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Estudiante</Form.Label>
                        <Form.Select value={selectedStudentRut} onChange={(e) => setSelectedStudentRut(e.target.value)}>
                          <option value="">Selecciona un estudiante</option>
                          {filteredStudents.map((student) => (
                            <option key={student.rut} value={student.rut}>
                              {student.nombres} {student.apellidosPaterno} {student.apellidosMaterno} - {student.curso}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <Form.Label>Tipo de atención</Form.Label>
                    <div className="emergency-toggle-row">
                      <Button
                        variant={attention.es_dolor ? 'danger' : 'outline-danger'}
                        className={`emergency-toggle-btn ${attention.es_dolor ? 'active' : ''}`}
                        onClick={() => toggleAttentionType('dolor')}
                      >
                        Dolor
                      </Button>
                      <Button
                        variant={attention.es_accidente ? 'danger' : 'outline-danger'}
                        className={`emergency-toggle-btn ${attention.es_accidente ? 'active' : ''}`}
                        onClick={() => toggleAttentionType('accidente')}
                      >
                        Accidente
                      </Button>
                    </div>
                  </div>

                  {attention.es_dolor && (
                    <div className="emergency-detail-panel mt-4">
                      <div className="emergency-panel-title">Sintomatología de dolor</div>
                      <div className="emergency-checkbox-grid">
                        {PAIN_ZONES.map((zone) => (
                          <Form.Check
                            key={zone}
                            type="checkbox"
                            id={`pain-zone-${zone}`}
                            label={zone}
                            checked={attention.detalle_dolor.zonas.includes(zone)}
                            onChange={() => togglePainZone(zone)}
                          />
                        ))}
                      </div>

                      <Form.Group className="mt-4">
                        <Form.Label>Intensidad del dolor: {attention.detalle_dolor.intensidad}/10</Form.Label>
                        <Form.Range
                          min={1}
                          max={10}
                          step={1}
                          value={attention.detalle_dolor.intensidad}
                          onChange={(e) =>
                            setAttention((current) => ({
                              ...current,
                              detalle_dolor: {
                                ...current.detalle_dolor,
                                intensidad: Number(e.target.value)
                              }
                            }))
                          }
                        />
                      </Form.Group>
                    </div>
                  )}

                  {attention.es_accidente && (
                    <div className="emergency-detail-panel mt-4">
                      <div className="emergency-panel-title">Origen del incidente</div>
                      <div className="emergency-checkbox-grid emergency-checkbox-grid--single">
                        {ACCIDENT_CAUSES.map((cause) => (
                          <Form.Check
                            key={cause.value}
                            type="checkbox"
                            id={`accident-${cause.value}`}
                            label={cause.label}
                            checked={attention.detalle_accidente.tipo === cause.value}
                            onChange={() => handleAccidentChange(cause.value)}
                          />
                        ))}
                      </div>

                      {attention.detalle_accidente.tipo === 'trayecto' && (
                        <Form.Group className="mt-3">
                          <Form.Label>Detalle de trayecto</Form.Label>
                          <Form.Control
                            type="text"
                            value={attention.detalle_accidente.trayecto_info}
                            onChange={(e) =>
                              setAttention((current) => ({
                                ...current,
                                detalle_accidente: {
                                  ...current.detalle_accidente,
                                  trayecto_info: e.target.value
                                }
                              }))
                            }
                            placeholder="Ejemplo: bajando del furgón o patio central"
                          />
                        </Form.Group>
                      )}
                    </div>
                  )}

                  <Form.Group className="mt-4">
                    <Form.Label>Observaciones de enfermería</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={attention.observaciones_libres}
                      onChange={(e) =>
                        setAttention((current) => ({
                          ...current,
                          observaciones_libres: e.target.value
                        }))
                      }
                      placeholder="Detalles específicos no contemplados en las opciones anteriores."
                    />
                  </Form.Group>

                  {selectedStudent && (
                    <Alert variant="info" className="mt-4 mb-0">
                      Se enviará a <strong>{selectedStudent.correoApoderado}</strong> para el estudiante{' '}
                      <strong>{previewValues.studentName}</strong> del curso <strong>{previewValues.course}</strong>.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="section-card h-100">
                <Card.Header>Vista previa del correo</Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="page-kpi__label">Asunto</div>
                    <div className="fw-bold text-dark">{previewSubject}</div>
                  </div>
                  <div className="page-panel p-3">
                    <div className="emergency-preview">{previewBody}</div>
                  </div>
                  <div className="d-grid mt-4">
                    <Button className="emergency-send-btn" onClick={handleSendEmergency} disabled={!selectedStudent || sending}>
                      {sending ? 'Enviando aviso...' : '🚑 Enviar aviso de emergencia'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="section-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Historial de emergencias enviadas</span>
              <Badge bg="danger">{history.length} registros</Badge>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive table-shell">
                <Table className="emergency-history-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estudiante</th>
                      <th>Curso</th>
                      <th>Tipo</th>
                      <th>Apoderado</th>
                      <th>Enviado por</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          Aún no hay avisos de emergencia registrados.
                        </td>
                      </tr>
                    ) : (
                      history.map((item) => (
                        <tr key={item._id}>
                          <td>{new Date(item.fechaEnvio).toLocaleString('es-CL')}</td>
                          <td>
                            <div className="fw-bold">{item.studentName}</div>
                            <div className="text-muted">{item.studentRut}</div>
                          </td>
                          <td>{item.course}</td>
                          <td>{item.templateLabel}</td>
                          <td>{item.guardianEmail}</td>
                          <td>{item.sentBy}</td>
                          <td>
                            <Badge bg={item.status === 'enviado' ? 'success' : 'danger'}>
                              {item.status === 'enviado' ? 'Enviado' : 'Error'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Emergencies;
