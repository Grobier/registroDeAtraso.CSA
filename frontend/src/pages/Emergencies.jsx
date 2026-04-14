import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Col, Container, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EmergencyComposer from '../components/emergencies/EmergencyComposer';
import EmergencyHero from '../components/emergencies/EmergencyHero';
import EmergencyHistoryCard from '../components/emergencies/EmergencyHistoryCard';
import EmergencyPreviewCard from '../components/emergencies/EmergencyPreviewCard';
import {
  PAIN_LEVELS,
  PAIN_ZONE_LABELS,
  createDefaultAttention,
  formatAccidentLabel,
  formatNaturalList
} from '../components/emergencies/emergencyConfig';
import '../styles/PageTheme.css';
import './Emergencies.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

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


const Emergencies = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudentRut, setSelectedStudentRut] = useState('');
  const [attention, setAttention] = useState(createDefaultAttention);
  const [history, setHistory] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const historySectionRef = useRef(null);

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

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) {
      return history;
    }

    return history.filter((item) => {
      const studentName = (item.studentName || '').toLowerCase();
      const studentRut = (item.studentRut || '').toLowerCase();
      const course = (item.course || '').toLowerCase();
      return studentName.includes(query) || studentRut.includes(query) || course.includes(query);
    });
  }, [history, historyQuery]);

  const selectedPainLevel = useMemo(() => {
    return PAIN_LEVELS.reduce((closest, level) => {
      return Math.abs(level.value - attention.detalle_dolor.intensidad) < Math.abs(closest.value - attention.detalle_dolor.intensidad)
        ? level
        : closest;
    }, PAIN_LEVELS[0]);
  }, [attention.detalle_dolor.intensidad]);

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

    const followUpLine = attention.es_accidente
      ? 'Al tratarse de un accidente, usted como apoderado/a tiene el deber de retirar al estudiante para trasladarlo a un servicio asistencial, según lo conversado telefónicamente.'
      : 'Según lo conversado telefónicamente, la decisión de retirar al estudiante para trasladarlo a un servicio asistencial queda a su criterio.';

    return {
      studentName,
      course: selectedStudent?.curso || selectedCourse || 'Curso',
      date: now.toLocaleDateString('es-CL'),
      accidentLine,
      painLine,
      followUpLine,
      insuranceLine: 'El estudiante cuenta con su seguro correspondiente.',
      observations: attention.observaciones_libres.trim() || 'Sin observaciones adicionales.'
    };
  }, [attention, selectedCourse, selectedStudent]);

  const previewSubject = useMemo(
    () => `Aviso de emergencia - ${previewValues.studentName}`,
    [previewValues.studentName]
  );

  const previewBody = useMemo(() => {
    const lines = [
      'Estimado apoderado:',
      '',
      `Informamos que el estudiante ${previewValues.studentName}, del curso ${previewValues.course}, fue atendido hoy ${previewValues.date}.`
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
      previewValues.followUpLine,
      '',
      'Este correo deja constancia del aviso realizado por el establecimiento.',
      '',
      'Atentamente,',
      'Colegio Saint Arieli'
    );

    return lines.join('\n');
  }, [previewValues]);

  const handleSessionExpired = async () => {
    setMessage({
      type: 'warning',
      text: 'Tu sesión expiró. Debes iniciar sesión nuevamente para enviar emergencias.'
    });

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionId');

    await Swal.fire({
      icon: 'warning',
      title: 'Sesión vencida',
      text: 'Debes iniciar sesión nuevamente para continuar.',
      confirmButtonColor: '#20498f'
    });

    navigate('/login');
  };

  const ensureAuthSession = async () => {
    const authData = await fetchJsonWithTimeout(`${API_BASE_URL}/api/auth/check-auth`, {
      credentials: 'include'
    });

    return authData?.authenticated === true;
  };

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
      await ensureAuthSession();

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
      if (error.message?.includes('401') || error.message?.toLowerCase().includes('no autenticado')) {
        await handleSessionExpired();
        return;
      }
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
          es_accidente: false,
          detalle_dolor: nextEnabled ? current.detalle_dolor : { zonas: [], intensidad: 5 },
          detalle_accidente: { tipo: '', trayecto_info: '' }
        };
      }

      const nextEnabled = !current.es_accidente;
      return {
        ...current,
        es_accidente: nextEnabled,
        es_dolor: false,
        detalle_accidente: nextEnabled
          ? current.detalle_accidente
          : { tipo: '', trayecto_info: '' },
        detalle_dolor: { zonas: [], intensidad: 5 }
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

  const handlePainLevelChange = (value) => {
    setAttention((current) => ({
      ...current,
      detalle_dolor: {
        ...current.detalle_dolor,
        intensidad: value
      }
    }));
  };

  const handleTrayectoInfoChange = (value) => {
    setAttention((current) => ({
      ...current,
      detalle_accidente: {
        ...current.detalle_accidente,
        trayecto_info: value
      }
    }));
  };

  const handleObservationsChange = (value) => {
    setAttention((current) => ({
      ...current,
      observaciones_libres: value
    }));
  };

  const validateAttention = () => {
    if (!selectedStudent) {
      return 'Debes seleccionar un estudiante antes de enviar el aviso.';
    }

    if (!attention.es_accidente && !attention.es_dolor) {
      return 'Debes activar Dolor o Accidente.';
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
      await Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: validationMessage,
        confirmButtonColor: '#20498f'
      });
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
          templateLabel: attention.es_accidente ? 'Accidente' : 'Dolor',
          subject: previewSubject,
          message: previewBody,
          observations: attention.observaciones_libres,
          atencion: attention
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          await handleSessionExpired();
          return;
        }
        const detailedMessage = data.error
          ? `${data.message || 'No se pudo enviar el aviso de emergencia'}: ${data.error}`
          : (data.message || 'No se pudo enviar el aviso de emergencia');
        throw new Error(detailedMessage);
      }

      setMessage({ type: 'success', text: data.message || 'Aviso enviado correctamente.' });
      setAttention(createDefaultAttention());
      await loadDataWithDiagnostics();
      await Swal.fire({
        icon: 'success',
        title: 'Aviso enviado',
        text: data.message || 'Aviso enviado correctamente.',
        confirmButtonColor: '#20498f'
      });
      historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'No se pudo enviar la emergencia.' });
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar el correo',
        text: error.message || 'No se pudo enviar la emergencia.',
        confirmButtonColor: '#20498f'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Container fluid className="page-shell emergency-page">
      <EmergencyHero
        totalStudents={students.length}
        historyCount={history.length}
        selectedStudent={selectedStudent}
        onRefresh={loadDataWithDiagnostics}
        loading={loading}
      />

      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      {loading ? (
        <div className="text-center py-5 emergency-loading-shell">
          <Spinner animation="border" role="status" />
          <p className="mt-3 mb-0 text-muted">Sincronizando estudiantes, cursos e historial de emergencias.</p>
        </div>
      ) : (
        <>
          <Row className="g-4 mb-4">
            <Col lg={7}>
              <EmergencyComposer
                courses={courses}
                filteredStudents={filteredStudents}
                selectedCourse={selectedCourse}
                selectedStudentRut={selectedStudentRut}
                selectedStudent={selectedStudent}
                previewValues={previewValues}
                attention={attention}
                selectedPainLevel={selectedPainLevel}
                onCourseChange={setSelectedCourse}
                onStudentChange={setSelectedStudentRut}
                onToggleAttentionType={toggleAttentionType}
                onTogglePainZone={togglePainZone}
                onPainLevelChange={handlePainLevelChange}
                onAccidentChange={handleAccidentChange}
                onTrayectoInfoChange={handleTrayectoInfoChange}
                onObservationsChange={handleObservationsChange}
              />
            </Col>

            <Col lg={5}>
              <EmergencyPreviewCard
                previewSubject={previewSubject}
                previewBody={previewBody}
                selectedStudent={selectedStudent}
                sending={sending}
                onSend={handleSendEmergency}
              />
            </Col>
          </Row>

          <EmergencyHistoryCard
            filteredHistory={filteredHistory}
            historyQuery={historyQuery}
            onHistoryQueryChange={setHistoryQuery}
            historySectionRef={historySectionRef}
          />
        </>
      )}
    </Container>
  );
};

export default Emergencies;

