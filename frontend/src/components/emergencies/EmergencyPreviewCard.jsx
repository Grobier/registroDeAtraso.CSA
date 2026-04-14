import React from 'react';
import { Badge, Button, Card } from 'react-bootstrap';

const EmergencyPreviewCard = ({ previewSubject, previewBody, selectedStudent, sending, onSend }) => {
  return (
    <Card className="section-card emergency-preview-card h-100">
      <Card.Header className="emergency-card-header">
        <div>
          <div className="emergency-card-header__eyebrow">Confirmación visual</div>
          <div className="emergency-card-header__title">Vista previa del correo</div>
        </div>
        <Badge bg={selectedStudent ? 'primary' : 'secondary'}>
          {selectedStudent ? 'Correo preparado' : 'Sin destinatario'}
        </Badge>
      </Card.Header>

      <Card.Body className="d-flex flex-column">
        <div className="emergency-preview-subject">
          <span className="page-kpi__label">Asunto</span>
          <strong>{previewSubject}</strong>
        </div>

        <div className="emergency-preview-window">
          <div className="emergency-preview-window__bar">
            <span />
            <span />
            <span />
          </div>
          <div className="emergency-preview">{previewBody}</div>
        </div>

        <div className="d-grid mt-4">
          <Button className="emergency-send-btn" onClick={onSend} disabled={!selectedStudent || sending}>
            {sending ? 'Enviando aviso...' : 'Enviar aviso de emergencia'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EmergencyPreviewCard;
