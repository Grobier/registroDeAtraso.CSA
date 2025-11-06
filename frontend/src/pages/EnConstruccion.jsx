import React from 'react';
import { Container } from 'react-bootstrap';

function EnConstruccion() {
  return (
    <div
      style={{
        // Fondo limpio, sin degradados
        background: 'transparent',
        color: '#212529',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container className="py-5">
        <div className="text-center">
          <img
            src="/Logo.png"
            alt="Logo del colegio"
            width="96"
            height="96"
            className="mb-3"
            style={{ objectFit: 'contain' }}
          />
          <h1
            className="display-4 fw-bold mb-2 d-flex align-items-center justify-content-center"
            style={{ gap: '0.5rem' }}
          >
            <span aria-hidden="true" style={{ fontSize: '2.5rem', lineHeight: 1 }}>🚧</span>
            <span>Estamos en construcción</span>
            <span aria-hidden="true" style={{ fontSize: '2.5rem', lineHeight: 1 }}>🚧</span>
          </h1>
          <p className="mb-4 text-muted" style={{ fontSize: '1.1rem' }}>
            Mientras tanto, recuerda anotar los atrasos para registrarlos después.
          </p>

          <div className="mx-auto p-4 bg-light border rounded" style={{ maxWidth: 560 }}>
            <p className="mb-2 fw-semibold">Qué debes hacer ahora</p>
            <ol className="text-start mb-3" style={{ paddingLeft: '1.2rem' }}>
              <li>Anota cada atraso en una hoja o planilla.</li>
              <li>Incluye los siguientes datos por estudiante:</li>
            </ol>
            <ul className="text-start mb-3" style={{ paddingLeft: '1.2rem' }}>
              <li>Nombre</li>
              <li>Curso</li>
              <li>Hora de atraso</li>
              <li>Motivo</li>
            </ul>
            <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
              Conserva la hoja para ingresarlos manualmente cuando la app esté lista.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default EnConstruccion;
