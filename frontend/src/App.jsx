// App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterTardiness from './pages/RegisterTardiness';
import StudentManagement from './pages/StudentManagement';
import Logout from './components/Logout';
import Footer from './components/Footer';
import { FaSun, FaMoon } from 'react-icons/fa';  // <-- Importa los íconos

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [isDarkMode, setIsDarkMode] = useState(false);


  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Botón flotante para cambiar tema */}
      

      {isAuthenticated && (
        <Navbar bg="primary" variant="dark" expand="lg" className="shadow">
          <Container>
            {/* Logo y título */}
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
              <img
                src="/Logo.png" 
                alt="Logo"
                width="40"
                height="40"
                className="d-inline-block align-top me-2"
              />
              <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>AtrasosApp</span>
            </Navbar.Brand>

            {/* Botón de colapso para pantallas pequeñas */}
            <Navbar.Toggle aria-controls="basic-navbar-nav" />

            {/* Opciones del menú */}
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/register" className="text-light">
                  <i className="fas fa-plus-circle me-2"></i> Registrar Atraso
                </Nav.Link>
                <Nav.Link as={Link} to="/students" className="text-light">
                  <i className="fas fa-users me-2"></i> Gestión Estudiantes
                </Nav.Link>
              </Nav>

              {/* Botón de cerrar sesión */}
              <Nav>
                <Logout onLogout={handleLogout} />
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      )}

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
          <Route
            path="/students"
            element={
              isAuthenticated ? <StudentManagement /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </Container>

      <Footer />
    </div>
  );
}

export default App;
