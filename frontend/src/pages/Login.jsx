// src/pages/Login.jsx
import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password
      }, {
        withCredentials: true // <--- importante para autenticación con cookies
      });
      if (response.data.sessionId) {
        // Guardar sesión, rol y username en localStorage
        localStorage.setItem('sessionId', response.data.sessionId);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', username); // <-- Guarda el nombre de usuario
        localStorage.setItem('isAuthenticated', 'true');
        onLogin();
        navigate('/dashboard');
      } else {
        setMensaje('Respuesta inesperada del servidor');
      }
    } catch (error) {
      setMensaje(
        error.response?.data?.message || 'Credenciales incorrectas o error de conexión'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center">
          <svg className="system-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
          </svg>
          <h2 className="login-title">Colegio Saint Arieli</h2>
          <p className="login-subtitle">Sistema de Control de Atrasos</p>
        </div>
        
        {mensaje && (
          <Alert variant="danger" className="login-alert">
            {mensaje}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} className="login-form">
          <Form.Group className="form-group">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
            />
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
            />
          </Form.Group>

          <Button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </Button>

          <div className="login-footer">
            <p>Formando líderes del mañana</p>
            <small>© {new Date().getFullYear()} Todos los derechos reservados</small>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Login;
