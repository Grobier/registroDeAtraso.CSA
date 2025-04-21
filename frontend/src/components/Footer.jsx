import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row className="text-center py-3">
          <Col>
            <h5 className="footer-title">Colegio Saint Arieli</h5>
            <p className="footer-text mb-1">Sistema de Control de Atrasos</p>
            <small className="footer-copyright">
              © {currentYear} Colegio Saint Arieli. Todos los derechos reservados.
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
