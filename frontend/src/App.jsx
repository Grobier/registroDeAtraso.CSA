// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import Dashboard from './pages/Dashboard';
import RegisterTardiness from './pages/RegisterTardiness';
import StudentManagement from './pages/StudentManagement';

function App() {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">Sistema de Atrasos</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/register">Registrar Atraso</Nav.Link>
              <Nav.Link as={Link} to="/students">Gestión Estudiantes</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/register" element={<RegisterTardiness />} />
        <Route path="/students" element={<StudentManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
