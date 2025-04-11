// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterTardiness from './pages/RegisterTardiness';
import StudentManagement from './pages/StudentManagement';
import Logout from './components/Logout';

function App() {
  // Definimos el estado de autenticación. Se inicializa leyendo del localStorage.
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  // Función que se llama cuando el usuario inicia sesión correctamente.
  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  // Función que se llama cuando el usuario cierra sesión.
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">Sistema de Atrasos</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {isAuthenticated && (
              <>
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                  <Nav.Link as={Link} to="/register">Registrar Atraso</Nav.Link>
                  <Nav.Link as={Link} to="/students">Gestión Estudiantes</Nav.Link>
                </Nav>
                {/* Se pasa la función handleLogout al componente Logout */}
                <Logout onLogout={handleLogout} />
              </>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-3">
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
    </>
  );
}

export default App;
