// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Spinner, Button } from 'react-bootstrap';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [tardiness, setTardiness] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [studentStats, setStudentStats] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [students, setStudents] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    course: '',
    student: '',
    startDate: null,
    endDate: null
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Función para obtener datos
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tardiness/statistics')
      ]);

      setTardiness(statsRes.data.allTardiness);
      setStudentStats(statsRes.data.statsByStudent);
      setCourseStats(statsRes.data.statsByCourse);
      
      // Obtener todos los estudiantes para mostrar nombres en las estadísticas
      axios.get('http://localhost:5000/api/students')
        .then(response => setStudents(response.data))
        .catch(err => console.error("Error al obtener todos los estudiantes:", err));
        
      setIsLoading(false);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setIsLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    // Obtener cursos
    axios.get('http://localhost:5000/api/students/curso')
      .then(response => setCourses(response.data))
      .catch(err => console.error(err));

    // Obtener atrasos y estadísticas
    fetchData();

    // Configurar actualización automática cada 30 segundos
    const interval = setInterval(fetchData, 30000);

    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      axios.get(`http://localhost:5000/api/students?curso=${selectedCourse}`)
        .then(response => setStudents(response.data))
        .catch(err => console.error(err));
    } else {
      setStudents([]);
    }
  }, [selectedCourse]);

  const handleApplyFilters = () => {
    console.log("Aplicando filtros:", {
      curso: selectedCourse, 
      estudiante: selectedStudent,
      fechaInicio: startDate,
      fechaFin: endDate
    });
    
    setIsFiltering(true);
    
    // Asegurarse de que los datos estén cargados
    if (tardiness.length === 0) {
      fetchData();
    }
    
    // Aplicar filtros directamente
    setAppliedFilters({
      course: selectedCourse,
      student: selectedStudent,
      startDate: startDate,
      endDate: endDate
    });

    // Simular un pequeño retraso para mostrar el estado de carga
    setTimeout(() => {
      setIsFiltering(false);
    }, 500);
  };

  const filteredTardiness = tardiness && tardiness.length > 0 ? tardiness.filter(record => {
    const recordDate = new Date(record.fecha);
    
    // Comparar curso
    const matchesCourse = !appliedFilters.course || record.curso === appliedFilters.course;
    
    // Comparar estudiante (RUT)
    const matchesStudent = !appliedFilters.student || record.studentRut === appliedFilters.student;
    
    // Comparar fechas
    let matchesStartDate = true;
    if (appliedFilters.startDate) {
      const startDateWithoutTime = new Date(appliedFilters.startDate);
      startDateWithoutTime.setHours(0, 0, 0, 0);
      const recordDateWithoutTime = new Date(recordDate);
      recordDateWithoutTime.setHours(0, 0, 0, 0);
      matchesStartDate = recordDateWithoutTime >= startDateWithoutTime;
    }
    
    let matchesEndDate = true;
    if (appliedFilters.endDate) {
      const endDateWithoutTime = new Date(appliedFilters.endDate);
      endDateWithoutTime.setHours(23, 59, 59, 999);
      const recordDateWithoutTime = new Date(recordDate);
      recordDateWithoutTime.setHours(0, 0, 0, 0);
      matchesEndDate = recordDateWithoutTime <= endDateWithoutTime;
    }
    
    const matchesDateRange = matchesStartDate && matchesEndDate;
    
    const result = matchesCourse && matchesStudent && matchesDateRange;
    
    // Para depuración
    if (appliedFilters.course || appliedFilters.student || appliedFilters.startDate || appliedFilters.endDate) {
      console.log(`Registro ${record._id || index}:`, {
        fecha: recordDate.toLocaleDateString(),
        curso: record.curso,
        estudianteRut: record.studentRut,
        matchesCourse, 
        matchesStudent, 
        matchesDateRange,
        incluido: result
      });
    }
    
    return result;
  }) : [];

  // Para depuración
  useEffect(() => {
    console.log("Filtros aplicados:", appliedFilters);
    console.log("Total registros filtrados:", filteredTardiness.length);
  }, [appliedFilters, filteredTardiness]);

  const getStudentName = (rut) => {
    const student = students.find(s => s.rut === rut);
    return student ? `${student.nombres} ${student.apellidosPaterno}` : rut;
  };

  // Preparar datos para el gráfico de Top 5 estudiantes
  const topStudentsWithNames = studentStats && studentStats.slice(0, 5).map(stat => ({
    ...stat,
    name: getStudentName(stat._id),
    rut: stat._id
  }));

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Preparar los datos para la exportación
    const dataToExport = filteredTardiness.map(record => ({
      'Fecha': new Date(record.fecha).toLocaleDateString(),
      'Hora': record.hora,
      'Estudiante': getStudentName(record.studentRut),
      'Curso': record.curso,
      'Motivo': record.motivo
    }));

    // Crear el libro de trabajo y la hoja
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atrasos");

    // Generar el archivo
    const fileName = `reporte_atrasos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Container className="mt-3">
      <h1>Dashboard de Atrasos</h1>
      
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>Filtros</Card.Title>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filtrar por Curso</Form.Label>
                    <Form.Select
                      value={selectedCourse}
                      onChange={(e) => { 
                        setSelectedCourse(e.target.value);
                        setSelectedStudent('');
                      }}
                    >
                      <option value="">Todos los cursos</option>
                      {courses.map((course, index) => (
                        <option key={index} value={course}>{course}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filtrar por Estudiante</Form.Label>
                    <Form.Select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      disabled={!selectedCourse}
                    >
                      <option value="">Todos los estudiantes</option>
                      {students.map((student) => (
                        <option key={student._id} value={student.rut}>
                          {student.nombres} {student.apellidosPaterno}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fecha Inicio</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      locale={es}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      placeholderText="Seleccione fecha inicio"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fecha Fin</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      locale={es}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      placeholderText="Seleccione fecha fin"
                    />
                  </Form.Group>
                </Col>
                <Col md={12} className="mt-3">
                  <Button 
                    variant="primary" 
                    onClick={handleApplyFilters}
                    className="me-2"
                    disabled={isFiltering}
                  >
                    {isFiltering ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Aplicando...
                      </>
                    ) : (
                      'Aplicar Filtros'
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setSelectedCourse('');
                      setSelectedStudent('');
                      setStartDate(null);
                      setEndDate(null);
                      setAppliedFilters({
                        course: '',
                        student: '',
                        startDate: null,
                        endDate: null
                      });
                    }}
                    disabled={isFiltering}
                  >
                    Limpiar Filtros
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Atrasos por Curso</Card.Title>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={courseStats || []}
                    dataKey="total"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {courseStats && courseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Top 5 Estudiantes con más Atrasos</Card.Title>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={topStudentsWithNames || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="rut" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      // Mostrar solo los últimos 4 dígitos del RUT
                      return value.slice(-4);
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Atrasos']}
                    labelFormatter={(value) => {
                      const student = topStudentsWithNames.find(s => s.rut === value);
                      return `Estudiante: ${student ? student.name : value}`;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Atrasos" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Card.Title>Registros de Atrasos</Card.Title>
          {isLoading || isFiltering ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">{isFiltering ? 'Aplicando filtros...' : 'Cargando datos...'}</p>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  variant="success" 
                  onClick={exportToExcel}
                  disabled={filteredTardiness.length === 0}
                >
                  <i className="fas fa-file-excel me-2"></i>
                  Exportar a Excel
                </Button>
              </div>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Curso</th>
                    <th>Estudiante</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTardiness.length > 0 ? (
                    filteredTardiness.map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.fecha).toLocaleDateString()}</td>
                        <td>{record.hora}</td>
                        <td>{record.curso}</td>
                        <td>{getStudentName(record.studentRut)}</td>
                        <td>{record.motivo}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No se encontraron registros con los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;
