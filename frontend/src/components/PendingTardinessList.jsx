import React, { useState } from 'react';
import { Modal, Table, Button, Badge, Alert, Row, Col } from 'react-bootstrap';
import { FaSync, FaTrash, FaClock, FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const PendingTardinessList = ({ show, onHide, pendingTardiness, onSync, onDelete, onSyncAll }) => {
  const [syncing, setSyncing] = useState({});
  const [syncingAll, setSyncingAll] = useState(false);

  const handleSync = async (id) => {
    setSyncing(prev => ({ ...prev, [id]: true }));
    try {
      await onSync(id);
    } finally {
      setSyncing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await onSyncAll();
    } finally {
      setSyncingAll(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-CL');
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          <FaClock className="me-2" />
          Atrasos Pendientes de Sincronización
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {pendingTardiness.length === 0 ? (
          <Alert variant="success" className="text-center">
            <FaWifi className="me-2" />
            <strong>¡Excelente!</strong><br />
            No hay atrasos pendientes de sincronizar.
          </Alert>
        ) : (
          <>
            <Alert variant="info" className="mb-3">
              <FaExclamationTriangle className="me-2" />
              <strong>{pendingTardiness.length}</strong> atrasos registrados sin conexión a internet.
              Sincronízalos cuando tengas conexión estable.
            </Alert>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Lista de Atrasos Pendientes</h6>
              <Button 
                variant="success" 
                size="sm"
                onClick={handleSyncAll}
                disabled={syncingAll}
              >
                {syncingAll ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <FaSync className="me-1" />
                    Sincronizar Todos
                  </>
                )}
              </Button>
            </div>

            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead className="table-dark">
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Estudiante</th>
                    <th>Curso</th>
                    <th>Motivo</th>
                    <th>Hora Llegada</th>
                    <th>Certificado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTardiness.map((tardiness) => (
                    <tr key={tardiness.id}>
                      <td>
                        <small>{formatDate(tardiness.timestamp)}</small>
                      </td>
                      <td>
                        <strong>{tardiness.estudiante}</strong>
                      </td>
                      <td>
                        <Badge bg="primary">{tardiness.curso}</Badge>
                      </td>
                      <td>
                        <small>{tardiness.motivo}</small>
                      </td>
                      <td>
                        <Badge bg="warning" text="dark">
                          {tardiness.hora}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={tardiness.trajoCertificado ? "success" : "danger"}>
                          {tardiness.trajoCertificado ? "Sí" : "No"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSync(tardiness.id)}
                            disabled={syncing[tardiness.id]}
                            title="Sincronizar"
                          >
                            {syncing[tardiness.id] ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <FaSync />
                            )}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(tardiness.id)}
                            title="Eliminar"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {pendingTardiness.some(t => t.observaciones) && (
              <div className="mt-3">
                <h6>Observaciones:</h6>
                {pendingTardiness
                  .filter(t => t.observaciones)
                  .map((tardiness) => (
                    <Alert key={tardiness.id} variant="light" className="py-2">
                      <strong>{tardiness.estudiante}:</strong> {tardiness.observaciones}
                    </Alert>
                  ))}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        {pendingTardiness.length > 0 && (
          <Button variant="success" onClick={handleSyncAll} disabled={syncingAll}>
            {syncingAll ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sincronizando...
              </>
            ) : (
              <>
                <FaSync className="me-1" />
                Sincronizar Todos
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PendingTardinessList;
