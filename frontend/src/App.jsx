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

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

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
      <div 
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999 // para que quede sobre todo
        }}
      >
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            background: isDarkMode ? '#333' : '#eee',
            color: isDarkMode ? '#fff' : '#000',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      {isAuthenticated && (
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">INICIO</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/register">Registrar Atraso</Nav.Link>
                <Nav.Link as={Link} to="/students">Gestión Estudiantes</Nav.Link>
              </Nav>
              <Logout onLogout={handleLogout} />
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
