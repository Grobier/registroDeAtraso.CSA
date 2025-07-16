// src/pages/RegisterTardiness.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlusCircle } from 'react-icons/fa';
import './RegisterTardiness.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const RegisterTardiness = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({ motivo: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obtener la lista de cursos
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/students/curso`)
      .then(response => setCourses(response.data))
      .catch(err => console.error("Error al obtener cursos:", err));
  }, []);

  // Cargar estudiantes al seleccionar un curso
  useEffect(() => {
    if (selectedCourse) {
      setStudents([]);
      axios.get(`${API_BASE_URL}/api/students`, { params: { curso: selectedCourse } })
        .then(response => setStudents(response.data))
        .catch(err => {
          console.error("Error al obtener estudiantes:", err);
          setStudents([]);
        });
    } else {
      setStudents([]);
    }
  }, [selectedCourse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    Swal.fire({
      title: '¿Está seguro que quiere registrar el atraso?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsLoading(true);

        axios.post(`${API_BASE_URL}/api/tardiness`, {
          ...formData,
          rut: selectedStudent,
          curso: selectedCourse
        }, { withCredentials: true })
          .then(response => {
            setIsLoading(false);
            setMessage(response.data.message);
            Swal.fire({
              title: '¡Registrado!',
              text: response.data.message,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });

            setFormData({ motivo: '' });
            setSelectedStudent('');
            setSelectedCourse('');
          })
          .catch(error => {
            setIsLoading(false);
            console.error("Error al registrar atraso:", error);
            setMessage('Error al registrar atraso');
            Swal.fire({
              title: 'Error',
              text: 'Error al registrar el atraso',
              icon: 'error'
            });
          });
      }
    });
  };

  return (
    <div className="register-tardiness-bg d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="register-tardiness-card animate__fadeIn">
        <div className="text-center mb-4">
          <FaPlusCircle size={38} color="#1a73e8" style={{ marginBottom: '-7px', marginRight: '8px' }} />
          <span className="register-tardiness-title">Registrar Atraso</span>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Curso</Form.Label>
            <Form.Select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSelectedStudent(''); }} className="input-modern">
              <option value="">Seleccione un curso</option>
              {courses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Estudiante</Form.Label>
            <Form.Select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-modern">
              <option value="">Seleccione un estudiante</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{student.nombres} {student.apellidosPaterno} {student.apellidosMaterno}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Motivo</Form.Label>
            <Form.Select name="motivo" value={formData.motivo} onChange={handleChange} className="input-modern">
              <option value="">Selecciona un motivo</option>
              <option value="Retraso en transporte">Retraso en transporte</option>
              <option value="Dificultades familiares imprevistas">Dificultades familiares imprevistas</option>
              <option value="Problemas de salud">Problemas de salud</option>
              <option value="Condiciones meteorológicas adversas">Condiciones meteorológicas adversas</option> 
              <option value="Despertar tardío">Despertar tardío</option>
              <option value="Tráfico">Tráfico</option>
              <option value="Fallas en el transporte público">Fallas en el transporte público</option>
              <option value="Accidente en el trayecto">Accidente en el trayecto</option>
              <option value="Emergencia personal">Emergencia personal</option>
              <option value="Se niega a entregar un motivo">Se niega a entregar un motivo</option>
            </Form.Select>
          </Form.Group>
          <div className="d-grid">
            <Button type="submit" className="register-btn-modern" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </>
              ) : 'Registrar'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RegisterTardiness;


