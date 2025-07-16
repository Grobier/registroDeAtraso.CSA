// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Modal, Table, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

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
  const [editForm, setEditForm] = useState({ username: '', email: '', role: '' });
  const [newPassword, setNewPassword] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Cargar usuarios cuando se abre el modal
  useEffect(() => {
    if (showUserModal) {
      setLoadingUsers(true);
      fetch('/api/auth/users', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setUsers(data);
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
    const res = await fetch(`/api/auth/users/${selectedUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm)
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(users.map(u => u._id === selectedUser._id ? data.user : u));
      setShowEditModal(false);
    } else {
      setActionMsg(data.message || 'Error al editar usuario');
    }
  };

  // Eliminar usuario
  const handleDelete = async (user) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    setActionMsg('');
    const res = await fetch(`/api/auth/users/${user._id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      setUsers(users.filter(u => u._id !== user._id));
    } else {
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
    const res = await fetch(`/api/auth/users/${selectedUser._id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      setShowPasswordModal(false);
    } else {
      setActionMsg(data.message || 'Error al resetear contraseña');
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
        <Navbar.Brand as={Link} to="/">AtrasosApp</Navbar.Brand>
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
    </Navbar>
  );
};

export default NavigationBar;
