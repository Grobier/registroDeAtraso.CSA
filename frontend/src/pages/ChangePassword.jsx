import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import './Login.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMensaje('Las nuevas contraseñas no coinciden');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword,
        sessionId: localStorage.getItem('sessionId')
      });

      if (response.data.message) {
        setMensaje('Contraseña actualizada exitosamente');
        // Limpiar formulario
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMensaje(error.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold">Cambiar Contraseña</h2>
                <p className="text-muted">Ingresa tu contraseña actual y la nueva</p>
              </div>
              
              {mensaje && (
                <Alert variant={mensaje.includes('exitosamente') ? 'success' : 'danger'}>
                  {mensaje}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formCurrentPassword" className="mb-3">
                  <Form.Label>Contraseña Actual</Form.Label>
                  <Form.Control
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    className="form-control-lg"
                    required
                  />
                </Form.Group>
                
                <Form.Group controlId="formNewPassword" className="mb-3">
                  <Form.Label>Nueva Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    className="form-control-lg"
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formConfirmPassword" className="mb-4">
                  <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    className="form-control-lg"
                    required
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2"
                  size="lg"
                >
                  Cambiar Contraseña
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ChangePassword; 