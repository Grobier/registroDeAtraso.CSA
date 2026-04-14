import React from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { ACCIDENT_CAUSES, PAIN_LEVELS, PAIN_ZONES } from './emergencyConfig';

const EmergencyComposer = ({
  courses,
  filteredStudents,
  selectedCourse,
  selectedStudentRut,
  selectedStudent,
  previewValues,
  attention,
  selectedPainLevel,
  onCourseChange,
  onStudentChange,
  onToggleAttentionType,
  onTogglePainZone,
  onPainLevelChange,
  onAccidentChange,
  onTrayectoInfoChange,
  onObservationsChange
}) => {
  return (
    <Card className="section-card emergency-highlight-card emergency-compose-card h-100">
      <Card.Header className="emergency-card-header">
        <div>
          <div className="emergency-card-header__eyebrow">Flujo guiado</div>
          <div className="emergency-card-header__title">Configurar aviso de emergencia</div>
        </div>
        <Badge bg={selectedStudent ? 'success' : 'secondary'}>
          {selectedStudent ? 'Listo para enviar' : 'Pendiente de estudiante'}
        </Badge>
      </Card.Header>

      <Card.Body>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Curso</Form.Label>
              <Form.Select value={selectedCourse} onChange={(e) => onCourseChange(e.target.value)}>
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
              <Form.Select value={selectedStudentRut} onChange={(e) => onStudentChange(e.target.value)}>
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

        <div className="emergency-type-switch">
          <div className="emergency-type-switch__label">Tipo de atención</div>
          <div className="emergency-type-switch__buttons">
            <Button
              variant={attention.es_dolor ? 'danger' : 'outline-danger'}
              className={`emergency-toggle-btn ${attention.es_dolor ? 'active' : ''}`}
              onClick={() => onToggleAttentionType('dolor')}
            >
              Dolor
            </Button>
            <Button
              variant={attention.es_accidente ? 'danger' : 'outline-danger'}
              className={`emergency-toggle-btn ${attention.es_accidente ? 'active' : ''}`}
              onClick={() => onToggleAttentionType('accidente')}
            >
              Accidente
            </Button>
          </div>
        </div>

        {attention.es_dolor && (
          <section className="emergency-detail-panel mt-4">
            <div className="emergency-panel-title">Sintomatología de dolor</div>
            <div className="emergency-checkbox-grid">
              {PAIN_ZONES.map((zone) => (
                <Form.Check
                  key={zone}
                  type="checkbox"
                  id={`pain-zone-${zone}`}
                  label={zone}
                  checked={attention.detalle_dolor.zonas.includes(zone)}
                  onChange={() => onTogglePainZone(zone)}
                />
              ))}
            </div>

            <Form.Group className="mt-4">
              <Form.Label>Escala visual del dolor</Form.Label>
              <div className="pain-scale-guide">
                <div className="pain-scale-bar">
                  {PAIN_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      className={`pain-scale-stop ${selectedPainLevel.value === level.value ? 'active' : ''}`}
                      style={{ '--pain-color': level.color }}
                      onClick={() => onPainLevelChange(level.value)}
                      aria-label={level.label}
                    />
                  ))}
                </div>

                <div className="pain-face-grid">
                  {PAIN_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      className={`pain-face-card ${selectedPainLevel.value === level.value ? 'active' : ''}`}
                      style={{ '--pain-color': level.color }}
                      onClick={() => onPainLevelChange(level.value)}
                    >
                      <span className="pain-face-emoji" aria-hidden="true">{level.face}</span>
                      <span className="pain-face-label">{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Form.Group>

            <div className="pain-scale-helper mt-3">
              Intensidad seleccionada: <strong>{attention.detalle_dolor.intensidad}/10</strong>
            </div>
          </section>
        )}

        {attention.es_accidente && (
          <section className="emergency-detail-panel mt-4">
            <div className="emergency-panel-title">Origen del incidente</div>
            <div className="emergency-checkbox-grid emergency-checkbox-grid--single">
              {ACCIDENT_CAUSES.map((cause) => (
                <Form.Check
                  key={cause.value}
                  type="checkbox"
                  id={`accident-${cause.value}`}
                  label={cause.label}
                  checked={attention.detalle_accidente.tipo === cause.value}
                  onChange={() => onAccidentChange(cause.value)}
                />
              ))}
            </div>

            {attention.detalle_accidente.tipo === 'trayecto' && (
              <Form.Group className="mt-3">
                <Form.Label>Detalle de trayecto</Form.Label>
                <Form.Control
                  type="text"
                  value={attention.detalle_accidente.trayecto_info}
                  onChange={(e) => onTrayectoInfoChange(e.target.value)}
                  placeholder="Ejemplo: bajando del furgón o patio central"
                />
              </Form.Group>
            )}
          </section>
        )}

        <Form.Group className="mt-4">
          <Form.Label>Observaciones de enfermería</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={attention.observaciones_libres}
            onChange={(e) => onObservationsChange(e.target.value)}
            placeholder="Detalles específicos no contemplados en las opciones anteriores."
          />
        </Form.Group>

        {selectedStudent && (
          <Alert variant="info" className="mt-4 mb-0 emergency-inline-alert">
            Se enviará a <strong>{selectedStudent.correoApoderado}</strong> para el estudiante{' '}
            <strong>{previewValues.studentName}</strong> del curso <strong>{previewValues.course}</strong>.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmergencyComposer;
