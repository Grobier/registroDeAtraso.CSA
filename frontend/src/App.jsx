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
                {`Hola :) ${localStorage.getItem('username') || ''}`}
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
                  {(role === 'admin' || role === 'registrador' || role === 'usuario') && (
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
                  
                  {/* Botón de Notificaciones para admin y registrador */}
                  {(role === 'admin' || role === 'registrador') && (
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
                {/* Solo admin y registrador pueden ver gestión estudiantes */}
            <Route
              path="/students"
              element={
                    isAuthenticated && (role === 'admin' || role === 'registrador' || role === 'usuario') ? <StudentManagement /> : <Navigate to="/dashboard" />
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
                
                {/* Solo admin y registrador pueden ver notificaciones */}
                <Route
                  path="/notifications"
                  element={
                    isAuthenticated && (role === 'admin' || role === 'registrador') ? <Notifications /> : <Navigate to="/dashboard" />
                  }
                />
              </Routes>
            </Container>
            <Footer />
            
            {/* Modal de gestión de usuarios (solo admin) */}
            <Modal 
              show={showUserModal} 
              onHide={() => setShowUserModal(false)} 
              size="lg"
              centered
              dialogClassName="modal-dialog-centered"
              style={{ marginTop: '5vh' }}
            >
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
                      {Array.isArray(users) && users.length > 0 ? (
                        users.map(u => (
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No hay usuarios o no autorizado.</td>
                        </tr>
                      )}
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
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
