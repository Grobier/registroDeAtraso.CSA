import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        password,
        role
      });

      if (response.data.message) {
        setMensaje('Usuario creado exitosamente');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setMensaje(error.response?.data?.message || 'Error al crear el usuario');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold">Registro</h2>
                <p className="text-muted">Crea una nueva cuenta</p>
              </div>
              
              {mensaje && (
                <Alert variant={mensaje.includes('exitosamente') ? 'success' : 'danger'}>
                  {mensaje}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formUsername" className="mb-3">
                  <Form.Label>Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="form-control-lg"
                    required
                  />
                </Form.Group>
                
                <Form.Group controlId="formPassword" className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="form-control-lg"
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formConfirmPassword" className="mb-3">
                  <Form.Label>Confirmar Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu contraseña"
                    className="form-control-lg"
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formRole" className="mb-4">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="form-control-lg"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2"
                  size="lg"
                >
                  Registrarse
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;