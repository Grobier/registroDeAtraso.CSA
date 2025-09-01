import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaFilter, FaDownload, FaSearch, FaChartBar, FaTrash, FaEye } from 'react-icons/fa';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para filtros
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);
  
  // Estados para estadísticas
  const [showStats, setShowStats] = useState(false);
  const [userStats, setUserStats] = useState({});
  
  // Estados para modal de detalles
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/activity-log`, { withCredentials: true });
        setLogs(response.data);
        setFilteredLogs(response.data);
      } catch (err) {
        setError('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Función para aplicar filtros
  useEffect(() => {
    let filtered = [...logs];

    // Filtro por usuario
    if (selectedUser) {
      filtered = filtered.filter(log => log.user === selectedUser);
    }

    // Filtro por acción
    if (selectedAction) {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Filtro por fecha desde
    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.createdAt) >= new Date(dateFrom));
    }

    // Filtro por fecha hasta
    if (dateTo) {
      filtered = filtered.filter(log => new Date(log.createdAt) <= new Date(dateTo + 'T23:59:59'));
    }

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Resetear a la primera página
  }, [logs, selectedUser, selectedAction, dateFrom, dateTo, searchTerm]);

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedUser('');
    setSelectedAction('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  // Función para generar estadísticas
  const generateStats = () => {
    const stats = {};
    filteredLogs.forEach(log => {
      if (!stats[log.user]) {
        stats[log.user] = { total: 0, actions: {} };
      }
      stats[log.user].total++;
      if (!stats[log.user].actions[log.action]) {
        stats[log.user].actions[log.action] = 0;
      }
      stats[log.user].actions[log.action]++;
    });
    setUserStats(stats);
    setShowStats(true);
  };

  // Función para exportar logs filtrados
  const exportLogs = () => {
    const csvContent = [
      ['Fecha', 'Usuario', 'Acción', 'Detalles'],
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.user,
        log.action,
        log.details
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_actividad_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para borrar un registro
  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas borrar este registro?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/activity-log/${id}`, { withCredentials: true });
      setLogs(logs.filter((log) => log._id !== id));
    } catch (err) {
      alert('Error al borrar el registro');
    }
  };

  // Función para ver detalles de un log
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Obtener usuarios únicos para el filtro
  const uniqueUsers = [...new Set(logs.map(log => log.user))].sort();
  
  // Obtener acciones únicas para el filtro
  const uniqueActions = [...new Set(logs.map(log => log.action))].sort();

  // Calcular logs para la página actual
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Función para cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2><FaChartBar className="me-2" />Historial de Actividad</h2>
          <p className="text-muted">Sistema de seguimiento de todas las acciones realizadas por los usuarios</p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={generateStats}>
            <FaChartBar className="me-2" />
            Ver Estadísticas
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Panel de Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <FaFilter className="me-2" />
          Filtros de Búsqueda
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Usuario</Form.Label>
                <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                  <option value="">Todos los usuarios</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Acción</Form.Label>
                <Form.Select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                  <option value="">Todas las acciones</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Desde</Form.Label>
                <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Hasta</Form.Label>
                <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Búsqueda</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button variant="outline-secondary" onClick={clearFilters} className="me-2">
                Limpiar Filtros
              </Button>
              <Button variant="success" onClick={exportLogs}>
                <FaDownload className="me-2" />
                Exportar CSV
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Resumen de Filtros */}
      <Alert variant="info" className="mb-3">
        <strong>Resultados:</strong> {filteredLogs.length} de {logs.length} registros encontrados
        {selectedUser && <span className="ms-2">• Usuario: <Badge bg="primary">{selectedUser}</Badge></span>}
        {selectedAction && <span className="ms-2">• Acción: <Badge bg="secondary">{selectedAction}</Badge></span>}
      </Alert>

      {/* Tabla de Logs */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Detalles</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <small>
                          {new Date(log.createdAt).toLocaleDateString('es-CL')}<br/>
                          <span className="text-muted">{new Date(log.createdAt).toLocaleTimeString('es-CL')}</span>
                        </small>
                      </td>
                      <td>
                        <Badge bg="primary">{log.user}</Badge>
                      </td>
                      <td>
                        <Badge bg="info">{log.action}</Badge>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '300px' }} title={log.details}>
                          {log.details}
                        </div>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewDetails(log)}
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(log._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                        Anterior
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                      <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => paginate(number)}>
                          {number}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal de Estadísticas */}
      <Modal show={showStats} onHide={() => setShowStats(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaChartBar className="me-2" />Estadísticas de Actividad</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.entries(userStats).map(([user, stats]) => (
            <Card key={user} className="mb-3">
              <Card.Header>
                <strong>{user}</strong> - Total: {stats.total} acciones
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(stats.actions).map(([action, count]) => (
                    <Col key={action} xs={6} md={4} className="mb-2">
                      <Badge bg="secondary" className="me-2">{action}</Badge>
                      <span>{count}</span>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Modal.Body>
      </Modal>

      {/* Modal de Detalles */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Registro</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <p><strong>Usuario:</strong> {selectedLog.user}</p>
              <p><strong>Acción:</strong> {selectedLog.action}</p>
              <p><strong>Fecha:</strong> {new Date(selectedLog.createdAt).toLocaleString('es-CL')}</p>
              <p><strong>Detalles:</strong></p>
              <div className="border p-3 bg-light rounded">
                {selectedLog.details}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ActivityLog; 