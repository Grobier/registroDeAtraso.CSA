import React from 'react';
import { Badge, Card, Col, Form, Row, Table } from 'react-bootstrap';

const statusVariantMap = {
  enviado: 'success',
  procesando: 'warning'
};

const statusLabelMap = {
  enviado: 'Enviado',
  procesando: 'Procesando'
};

const EmergencyHistoryCard = ({ filteredHistory, historyQuery, onHistoryQueryChange, historySectionRef }) => {
  return (
    <Card className="section-card emergency-history-card" ref={historySectionRef}>
      <Card.Header className="emergency-card-header">
        <div>
          <div className="emergency-card-header__eyebrow">Trazabilidad</div>
          <div className="emergency-card-header__title">Historial de emergencias enviadas</div>
        </div>
        <Badge bg="danger">{filteredHistory.length} registros</Badge>
      </Card.Header>

      <Card.Body>
        <Row className="g-3 mb-3">
          <Col md={6} lg={5}>
            <Form.Group>
              <Form.Label>Buscar estudiante en historial</Form.Label>
              <Form.Control
                type="text"
                value={historyQuery}
                onChange={(e) => onHistoryQueryChange(e.target.value)}
                placeholder="Busca por nombre, RUT o curso"
              />
            </Form.Group>
          </Col>
        </Row>

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
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    {historyQuery.trim()
                      ? 'No hay resultados para esa búsqueda en el historial.'
                      : 'Aún no hay avisos de emergencia registrados.'}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
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
                      <Badge bg={statusVariantMap[item.status] || 'danger'}>
                        {statusLabelMap[item.status] || 'Error'}
                      </Badge>
                    </td>
                    <td>
                      {item.status === 'enviado' ? (
                        <span className="text-muted">Correo enviado correctamente.</span>
                      ) : item.status === 'procesando' ? (
                        <span className="text-muted">El correo sigue en proceso de envío.</span>
                      ) : (
                        <span className="text-danger fw-semibold">
                          {item.error || 'No se pudo determinar el motivo del fallo.'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EmergencyHistoryCard;
