import React from 'react';
import { Badge, Button } from 'react-bootstrap';

const EmergencyHero = ({ totalStudents, historyCount, selectedStudent, onRefresh, loading }) => {
  return (
    <section className="emergency-hero">
      <div className="emergency-hero__content">
        <div className="emergency-hero__eyebrow">Centro de atención inmediata</div>
        <h1 className="page-title mb-2">Emergencias</h1>
        <p className="page-subtitle mb-0">
          Gestiona avisos de enfermería con un flujo claro, correo listo para enviar y trazabilidad de cada atención.
        </p>
        <div className="emergency-hero__badges">
          <Badge bg="light" text="dark" className="emergency-hero__badge">
            {totalStudents} estudiantes disponibles
          </Badge>
          <Badge bg="light" text="dark" className="emergency-hero__badge">
            {historyCount} registros históricos
          </Badge>
          {selectedStudent && (
            <Badge bg="light" text="dark" className="emergency-hero__badge">
              En foco: {selectedStudent.nombres} {selectedStudent.apellidosPaterno}
            </Badge>
          )}
        </div>
      </div>

      <div className="emergency-hero__actions">
        <div className="emergency-top-note">Aviso prioritario para retiro de estudiantes</div>
        <Button variant="outline-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </Button>
      </div>
    </section>
  );
};

export default EmergencyHero;
