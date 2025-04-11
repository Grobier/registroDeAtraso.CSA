// src/components/Logout.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onLogout(); // Actualiza el estado en App.jsx y elimina la autenticación
    navigate('/login');
  };

  return (
    <Button variant="warning" onClick={handleClick}>
      Cerrar sesión
    </Button>
  );
};

export default Logout;
