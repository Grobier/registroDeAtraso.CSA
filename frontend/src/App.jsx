// App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Modal, Table, Form } from 'react-bootstrap';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterTardiness from './pages/RegisterTardiness';
import StudentManagement from './pages/StudentManagement';
import CreateUser from './pages/CreateUser';
import Notifications from './pages/Notifications';
import Logout from './components/Logout';
import Footer from './components/Footer';
import { FaSun, FaMoon, FaTachometerAlt, FaPlusCircle, FaUsers, FaUserPlus, FaHistory, FaUserCog, FaEnvelope } from 'react-icons/fa';  // <-- Importa los íconos
import ActivityLog from './pages/ActivityLog';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900); // visible en escritorio, oculto en móvil
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // colapsado por defecto en escritorio

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  // Obtener el rol del usuario
  const role = localStorage.getItem('role');
  // Estado para gestión de usuarios (solo admin)
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

  // Manejar resize para sidebar responsivo
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para manejar el click en enlaces del sidebar
  const handleSidebarLinkClick = () => {
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  return (
    <>
      <div className="d-flex flex-column min-vh-100">
        {isAuthenticated && (
          <div className="session-topbar w-100 d-flex justify-content-between align-items-center px-4 py-2 shadow-sm">
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-link text-primary fs-2 me-2 d-lg-none"
                style={{ textDecoration: 'none', boxShadow: 'none' }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                &#9776;
              </button>
              <img src="/Logo.png" alt="Logo" width="40" height="40" className="me-2" />
              <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#1a73e8', fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif' }}>AtrasosApp</span>
            </div>
            <div className="d-flex align-items-center">
              <div style={{ color: '#185abc', fontWeight: 'bold', fontSize: '1.15rem', marginRight: 16, fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif' }}>
                {`Bienvenido, ${localStorage.getItem('username') || ''}`}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('username');
                  localStorage.removeItem('role');
                  localStorage.removeItem('sessionId');
                  setIsAuthenticated(false);
                }}
                className="btn btn-warning btn-sm"
                style={{ minWidth: 120 }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
        <div className="d-flex flex-grow-1">
          {isAuthenticated && sidebarOpen && (
            <div
              className={`sidebar-navbar d-flex flex-column align-items-center py-4 px-2${sidebarCollapsed ? ' collapsed' : ''}`}
              onMouseEnter={() => setSidebarCollapsed(false)}
              onMouseLeave={() => setSidebarCollapsed(true)}
            >

              <nav className="flex-grow-1 w-100">
                <ul className="nav flex-column w-100">
                  <li className="nav-item mb-2">
                    <Link to="/dashboard" className="nav-link nav-link-custom w-100 d-flex align-items-center gap-2" onClick={handleSidebarLinkClick}>
                      <FaTachometerAlt size={20} />
                      <span className="sidebar-link-text">Inicio</span>
                    </Link>
                  </li>
                  <li className="nav-item mb-2">
                    <Link to="/register" className="nav-link nav-link-custom w-100 d-flex align-items-center gap-2" onClick={handleSidebarLinkClick}>
                      <FaPlusCircle size={20} />
                      <span className="sidebar-link-text">Registrar</span>
                    </Link>
                  </li>
                  {(role === 'admin' || role === 'usuario') && (
                    <li className="nav-item mb-2">
                      <Link to="/students" className="nav-link nav-link-custom w-100 d-flex align-items-center gap-2" onClick={handleSidebarLinkClick}>
                        <FaUsers size={20} />
                        <span className="sidebar-link-text">Estudiantes</span>
                      </Link>
                    </li>
                  )}
                  {role === 'admin' && (
                    <>
                      <li className="nav-item mb-2">
                        <Link to="/create-user" className="nav-link nav-link-custom w-100 d-flex align-items-center gap-2" onClick={handleSidebarLinkClick}>
                          <FaUserPlus size={20} />
                          <span className="sidebar-link-text">Nuevo Usuario</span>
                        </Link>
                      </li>
                      <li className="nav-item mb-2">
                        <Link to="/activity-log" className="nav-link nav-link-custom w-100 d-flex align-items-center gap-2" onClick={handleSidebarLinkClick}>
                          <FaHistory size={20} />
                          <span className="sidebar-link-text">Historial</span>
                        </Link>
                      </li>
                      <li className="nav-item mb-2">
                        <button className="btn btn-gestionar-usuarios w-100 d-flex align-items-center gap-2" onClick={() => { setShowUserModal(true); handleSidebarLinkClick(); }}>
                          <FaUserCog size={20} />
                          <span className="sidebar-link-text">Usuarios</span>
                        </button>
                      </li>
                    </>
                  )}
                  
                  {/* Botón de Notificaciones para admin y profesor */}
                  {(role === 'admin' || role === 'profesor') && (
                    <li className="nav-item mb-2">
                      <Link to="/notifications" className="nav-link nav-link-custom w-100 d-flex align-items-center gap-2" onClick={handleSidebarLinkClick}>
                        <FaEnvelope size={20} />
                        <span className="sidebar-link-text">Notificaciones</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          )}
          <div className={`flex-grow-1 d-flex flex-column main-content-area${sidebarOpen ? (sidebarCollapsed ? ' sidebar-collapsed' : ' sidebar-expanded') : ''}`}>
            <Container className={!isAuthenticated ? 'p-0 m-0 mw-100 flex-grow-1' : 'mt-3 flex-grow-1'}>
              <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              }
            />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? <RegisterTardiness /> : <Navigate to="/login" />
              }
            />
                {/* Solo admin y usuario pueden ver gestión estudiantes */}
            <Route
              path="/students"
              element={
                    isAuthenticated && (role === 'admin' || role === 'usuario') ? <StudentManagement /> : <Navigate to="/dashboard" />
              }
            />
                {/* Solo admin puede crear usuario */}
            <Route
              path="/create-user"
                  element={
                    isAuthenticated && role === 'admin' ? <CreateUser /> : <Navigate to="/dashboard" />
                  }
                />
                {/* Solo admin puede ver historial de actividad */}
                <Route
                  path="/activity-log"
                  element={
                    isAuthenticated && role === 'admin' ? <ActivityLog /> : <Navigate to="/dashboard" />
                  }
                />
                
                {/* Solo admin y profesor pueden ver notificaciones */}
                <Route
                  path="/notifications"
                  element={
                    isAuthenticated && (role === 'admin' || role === 'profesor') ? <Notifications /> : <Navigate to="/dashboard" />
                  }
                />
              </Routes>
            </Container>
            <Footer />
            
            {/* Modal de gestión de usuarios (solo admin) */}
            <Modal 
              show={showUserModal} 
              onHide={() => setShowUserModal(false)} 
              size="xl"
              centered
              className="user-management-modal"
            >
              <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-dark">
                  👥 Gestión de Usuarios
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="px-4 py-3">
                {loadingUsers ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted mt-3 mb-0">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="mb-0" size="sm">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0 py-3 px-3 text-muted small fw-normal">Usuario</th>
                          <th className="border-0 py-3 px-3 text-muted small fw-normal">Email</th>
                          <th className="border-0 py-3 px-3 text-muted small fw-normal">Rol</th>
                          <th className="border-0 py-3 px-3 text-muted small fw-normal text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(users) && users.length > 0 ? (
                          users.map(u => (
                            <tr key={u._id} className="border-bottom">
                              <td className="py-3 px-3">
                                <div className="d-flex align-items-center">
                                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="fw-medium small">{u.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-muted small">{u.email}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`badge ${
                                  u.role === 'admin' ? 'bg-danger' :
                                  u.role === 'profesor' ? 'bg-info' :
                                  'bg-secondary'
                                }`} style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>
                                  {u.role === 'admin' ? 'Admin' :
                                   u.role === 'profesor' ? 'Profesor' :
                                   'Usuario'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="d-flex gap-1 justify-content-center">
                                  <Button 
                                    size="sm" 
                                    variant="outline-primary" 
                                    className="px-3 py-1" 
                                    style={{ fontSize: '0.75rem', borderRadius: '0.375rem' }}
                                    onClick={() => handleEdit(u)}
                                  >
                                    ✏️ Editar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline-warning" 
                                    className="px-3 py-1" 
                                    style={{ fontSize: '0.75rem', borderRadius: '0.375rem' }}
                                    onClick={() => handleResetPassword(u)}
                                  >
                                    🔑 Reset
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline-danger" 
                                    className="px-3 py-1" 
                                    style={{ fontSize: '0.75rem', borderRadius: '0.375rem' }}
                                    onClick={() => handleDelete(u)}
                                  >
                                    🗑️ Eliminar
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-5">
                              <div className="text-muted">
                                <i className="fas fa-users" style={{ fontSize: '2rem', opacity: '0.3' }}></i>
                                <p className="mt-3 mb-0">No hay usuarios disponibles</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
                {actionMsg && (
                  <div className="alert alert-danger mt-3 mb-0 py-2" style={{ fontSize: '0.85rem' }}>
                    {actionMsg}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="border-0 pt-0">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2"
                  style={{ borderRadius: '0.5rem' }}
                >
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Modal para editar usuario */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
              <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-dark">
                  ✏️ Editar Usuario
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="px-4 py-3">
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-muted small">Nombre de Usuario</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={editForm.username} 
                      onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      className="border-0 bg-light"
                      style={{ borderRadius: '0.5rem', padding: '0.75rem' }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-muted small">Correo Electrónico</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={editForm.email} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="border-0 bg-light"
                      style={{ borderRadius: '0.5rem', padding: '0.75rem' }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-muted small">Rol del Usuario</Form.Label>
                    <Form.Select 
                      value={editForm.role} 
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      className="border-0 bg-light"
                      style={{ borderRadius: '0.5rem', padding: '0.75rem' }}
                    >
                      <option value="admin">👑 Administrador</option>
                      <option value="profesor">👨‍🏫 Profesor</option>
                      <option value="usuario">👤 Usuario</option>
                    </Form.Select>
                  </Form.Group>
                </Form>
                {actionMsg && (
                  <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
                    {actionMsg}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="border-0 pt-0">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 me-2"
                  style={{ borderRadius: '0.5rem' }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveEdit}
                  className="px-4 py-2"
                  style={{ borderRadius: '0.5rem' }}
                >
                  💾 Guardar Cambios
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Modal para resetear contraseña */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
              <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-dark">
                  🔑 Resetear Contraseña
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="px-4 py-3">
                <div className="text-center mb-4">
                  <div className="bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="fas fa-key" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <p className="text-muted mb-0">Ingresa la nueva contraseña para <strong>{selectedUser?.username}</strong></p>
                </div>
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-muted small">Nueva Contraseña</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      className="border-0 bg-light"
                      style={{ borderRadius: '0.5rem', padding: '0.75rem' }}
                      placeholder="Ingresa la nueva contraseña"
                    />
                  </Form.Group>
                </Form>
                {actionMsg && (
                  <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
                    {actionMsg}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="border-0 pt-0">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 me-2"
                  style={{ borderRadius: '0.5rem' }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="warning" 
                  onClick={handleSavePassword}
                  className="px-4 py-2"
                  style={{ borderRadius: '0.5rem' }}
                >
                  🔑 Guardar Contraseña
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
