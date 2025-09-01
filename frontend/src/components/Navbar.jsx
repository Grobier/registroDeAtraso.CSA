// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Modal, Table, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import NotificationsModal from './NotificationsModal';
import axios from 'axios';
import './Navbar.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

const NavigationBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const role = localStorage.getItem('role');
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Log cuando cambia el estado del modal
  useEffect(() => {
    console.log('🔄 showNotificationsModal cambió a:', showNotificationsModal);
  }, [showNotificationsModal]);
  const [editForm, setEditForm] = useState({ username: '', email: '', role: '' });
  const [newPassword, setNewPassword] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Cargar usuarios cuando se abre el modal
  useEffect(() => {
    if (showUserModal) {
      setLoadingUsers(true);
      axios.get(`${API_BASE_URL}/api/auth/users`, { withCredentials: true })
        .then(response => {
          setUsers(response.data);
          setLoadingUsers(false);
        })
        .catch(() => setLoadingUsers(false));
    }
  }, [showUserModal]);

  // Abrir modal de edición
  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role });
    setShowEditModal(true);
  };

  // Guardar cambios de usuario
  const handleSaveEdit = async () => {
    setActionMsg('');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/users/${selectedUser._id}`, editForm, { withCredentials: true });
      setUsers(users.map(u => u._id === selectedUser._id ? response.data.user : u));
      setShowEditModal(false);
    } catch (error) {
      setActionMsg(error.response?.data?.message || 'Error al editar usuario');
    }
  };

  // Eliminar usuario
  const handleDelete = async (user) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    setActionMsg('');
    try {
      await axios.delete(`${API_BASE_URL}/api/auth/users/${user._id}`, { withCredentials: true });
      setUsers(users.filter(u => u._id !== user._id));
    } catch (error) {
      setActionMsg('Error al eliminar usuario');
    }
  };

  // Abrir modal para resetear contraseña
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  // Guardar nueva contraseña
  const handleSavePassword = async () => {
    setActionMsg('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/users/${selectedUser._id}/reset-password`, { newPassword }, { withCredentials: true });
      setShowPasswordModal(false);
    } catch (error) {
      setActionMsg(error.response?.data?.message || 'Error al resetear contraseña');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <div 
          className="navbar-brand d-flex align-items-center"
          style={{
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out'
          }}
          onClick={() => {
            console.log('🎯 Logo/Texto clickeado! Navegando al Dashboard...');
            navigate('/dashboard');
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <img 
            src="/Logo.png" 
            alt="Logo AtrasosApp" 
            height="40" 
            className="me-2"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s ease-in-out'
            }}
          />
          <span 
            style={{ 
              fontWeight: 'bold',
              fontSize: '1.4rem',
              color: '#fff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              transition: 'color 0.2s ease-in-out'
            }}
          >
            AtrasosApp
          </span>
        </div>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/register">Registrar Atraso</Nav.Link>
            <Nav.Link as={Link} to="/create-user">Crear Usuario</Nav.Link>
            {(role === 'admin' || role === 'registrador' || role === 'usuario') && (
              <Nav.Link as={Link} to="/students" className="text-light">
                Gestión Estudiantes
              </Nav.Link>
            )}
            {role === 'admin' && (
              <Button variant="outline-info" className="ms-2" onClick={() => setShowUserModal(true)}>
                Gestionar Usuarios
              </Button>
            )}
            {(role === 'admin' || role === 'registrador') && (
              <Button variant="outline-warning" className="ms-2" onClick={() => {
                alert('🔘 Botón Notificaciones clickeado!');
                console.log('🔘 Botón Notificaciones clickeado');
                console.log('📊 Estado actual showNotificationsModal:', showNotificationsModal);
                setShowNotificationsModal(true);
                console.log('✅ showNotificationsModal establecido en true');
              }}>
                📧 Notificaciones
              </Button>
            )}
          </Nav>
          <Nav className="ms-auto align-items-center">
            {user && (
              <span style={{ color: 'white', marginRight: '1rem' }}>
                {user.username}
              </span>
            )}
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Cerrar sesión</button>
          </Nav>
        </Navbar.Collapse>
      </Container>
      {/* Modal de gestión de usuarios */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Gestión de Usuarios</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingUsers ? (
            <div>Cargando usuarios...</div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <Button size="sm" variant="primary" className="me-2" onClick={() => handleEdit(u)}>Editar</Button>
                      <Button size="sm" variant="warning" className="me-2" onClick={() => handleResetPassword(u)}>Resetear Contraseña</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {actionMsg && <div className="text-danger mt-2">{actionMsg}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para editar usuario */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control type="text" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="admin">Administrador</option>
                <option value="registrador">Registrador</option>
                <option value="usuario">Usuario</option>
              </Form.Select>
            </Form.Group>
          </Form>
          {actionMsg && <div className="text-danger mt-2">{actionMsg}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveEdit}>Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para resetear contraseña */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resetear Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nueva Contraseña</Form.Label>
              <Form.Control type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </Form.Group>
          </Form>
          {actionMsg && <div className="text-danger mt-2">{actionMsg}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSavePassword}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Notificaciones */}
      {console.log('🎭 Renderizando NotificationsModal en Navbar, show:', showNotificationsModal)}
      {showNotificationsModal && <div style={{color: 'red', fontSize: '20px'}}>🔴 MODAL DEBERÍA ESTAR ABIERTO</div>}
      <NotificationsModal 
        show={showNotificationsModal} 
        onHide={() => setShowNotificationsModal(false)} 
      />
    </Navbar>
  );
};

export default NavigationBar;
