// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';
import * as XLSX from 'xlsx';
import { FaCalendarAlt, FaUserGraduate, FaSchool, FaDownload, FaFilter, FaClock, FaChartLine, FaExclamation, FaSun, FaMoon, FaInfoCircle, FaSearch, FaSave, FaTrash } from 'react-icons/fa';
import './Dashboard.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [weatherData, setWeatherData] = useState(null);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [averageDelay, setAverageDelay] = useState(0);
  const [weekdayStats, setWeekdayStats] = useState([]);
  const [timeStats, setTimeStats] = useState([]);

  const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#46bdc6'];

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
    axios.get('http://localhost:5000/api/students/curso')
      .then(response => setCourses(response.data))
      .catch(err => console.error(err));
  
    fetchData();
    

    const interval = setInterval(fetchData, 30000);

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
    
    if (tardiness.length === 0) {
      fetchData();
    }
    
    
    setAppliedFilters({
      course: selectedCourse,
      student: selectedStudent,
      startDate: startDate,
      endDate: endDate
    });

    setTimeout(() => {
      setIsFiltering(false);
    }, 500);
  };

  const filteredTardiness = tardiness && tardiness.length > 0 ? tardiness.filter(record => {
    const recordDate = new Date(record.fecha);
    const matchesCourse = !appliedFilters.course || record.curso === appliedFilters.course;
    const matchesStudent = !appliedFilters.student || record.studentRut === appliedFilters.student;
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
    
    if (appliedFilters.course || appliedFilters.student || appliedFilters.startDate || appliedFilters.endDate) {
      console.log(`Registro ${record._id}:`, {
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

  useEffect(() => {
    console.log("Filtros aplicados:", appliedFilters);
    console.log("Total registros filtrados:", filteredTardiness.length);
  }, [appliedFilters, filteredTardiness]);

  const getStudentName = (rut) => {
    const student = students.find(s => s.rut === rut);
    return student ? `${student.nombres} ${student.apellidosPaterno}` : rut;
  };

  const topStudentsWithNames = studentStats && studentStats.slice(0, 5).map(stat => ({
    ...stat,
    name: getStudentName(stat._id),
    rut: stat._id
  }));

  console.log("Datos de topStudentsWithNames:", topStudentsWithNames); 

  const exportToExcel = () => {
    const dataToExport = filteredTardiness.map(record => ({
      'Fecha': new Date(record.fecha).toLocaleDateString(),
      'Hora': record.hora,
      'Estudiante': getStudentName(record.studentRut),
      'Curso': record.curso,
      'Motivo': record.motivo
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atrasos");

    const fileName = `reporte_atrasos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  useEffect(() => {
    setWeatherData({
      temp: '18°C',
      condition: 'Parcialmente nublado',
      icon: <FaClock />
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayAtrasos = tardiness.filter(t => 
      t.fecha.split('T')[0] === todayStr
    ).length;
    
    setTodayCount(todayAtrasos);

    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAtrasos = tardiness.filter(t => 
      new Date(t.fecha) >= weekAgo
    ).length;
    
    setWeekCount(weekAtrasos);

    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthAtrasos = tardiness.filter(t => 
      new Date(t.fecha) >= monthAgo
    ).length;
    
    setMonthCount(monthAtrasos);
  }, [tardiness]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTardiness.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTardiness.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const calculateWeekdayStats = () => {
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const stats = new Array(7).fill(0);
    
    tardiness.forEach(record => {
      const date = new Date(record.fecha);
      stats[date.getDay()]++;
    });

    setWeekdayStats(weekdays.map((day, index) => ({
      name: day,
      total: stats[index]
    })));
  };

  const calculateTimeStats = () => {
    const timeRanges = {};
    
    tardiness.forEach(record => {
      const hour = record.hora.split(':')[0];
      timeRanges[hour] = (timeRanges[hour] || 0) + 1;
    });

    const stats = Object.entries(timeRanges).map(([hour, count]) => ({
      hour: `${hour}:00`,
      total: count
    })).sort((a, b) => a.hour.localeCompare(b.hour));

    setTimeStats(stats);
  };

  const handleSaveFilter = () => {
    const newFilter = {
      name: filterName,
      filters: {
        course: selectedCourse,
        student: selectedStudent,
        startDate,
        endDate
      }
    };
    setSavedFilters([...savedFilters, newFilter]);
    setShowSaveFilterModal(false);
    setFilterName('');
  };

  const applySavedFilter = (filter) => {
    setSelectedCourse(filter.filters.course);
    setSelectedStudent(filter.filters.student);
    setStartDate(filter.filters.startDate);
    setEndDate(filter.filters.endDate);
    handleApplyFilters();
  };

  const showRecordDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  useEffect(() => {
    if (tardiness.length > 0) {
      calculateWeekdayStats();
      calculateTimeStats();
      
      const totalMinutes = tardiness.reduce((acc, record) => {
        const [hours, minutes] = record.hora.split(':').map(Number);
        return acc + (hours * 60 + minutes - 480);
      }, 0);
      setAverageDelay(totalMinutes / tardiness.length);
    }
  }, [tardiness]);

  const DetailModal = () => (
    <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Atraso</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedRecord && (
          <div>
            <p><strong>Fecha:</strong> {new Date(selectedRecord.fecha).toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {selectedRecord.hora}</p>
            <p><strong>Estudiante:</strong> {getStudentName(selectedRecord.studentRut)}</p>
            <p><strong>Curso:</strong> {selectedRecord.curso}</p>
            <p><strong>Motivo:</strong> {selectedRecord.motivo}</p>
            <p><strong>Minutos de atraso:</strong> {calculateDelay(selectedRecord.hora)}</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );

  const calculateDelay = (hora) => {
    const [hours, minutes] = hora.split(':').map(Number);
    return (hours * 60 + minutes) - 480;
  };

  const exportToPDF = () => {
    try {
      const pdfDoc = new jsPDF();
      
      pdfDoc.setFontSize(18);
      pdfDoc.text('Reporte de Atrasos', 14, 22);
      
      pdfDoc.setFontSize(11);
      pdfDoc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
      
      pdfDoc.setFontSize(14);
      pdfDoc.text('Resumen de Estadísticas', 14, 45);
      pdfDoc.setFontSize(11);
      
      const stats = [
        `Total de atrasos hoy: ${todayCount}`,
        `Total de atrasos esta semana: ${weekCount}`,
        `Total de atrasos este mes: ${monthCount}`,
        `Promedio de minutos de atraso: ${averageDelay.toFixed(1)} minutos`
      ];
      
      stats.forEach((text, index) => {
        pdfDoc.text(text, 14, 55 + (index * 7));
      });
      
      const tableData = filteredTardiness.map(record => [
        new Date(record.fecha).toLocaleDateString(),
        record.hora,
        record.curso,
        getStudentName(record.studentRut),
        record.motivo
      ]);
      
      autoTable(pdfDoc, {
        startY: 85,
        head: [['Fecha', 'Hora', 'Curso', 'Estudiante', 'Motivo']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 2 
        },
        headStyles: { 
          fillColor: [26, 115, 232],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      
      pdfDoc.save(`reporte_atrasos_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Componente de tooltip personalizado para el gráfico de barras con estilo modificado y verificación de la propiedad "name"
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: 5,
          padding: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Estudiante: {data.name}</p>
          <p style={{ margin: 0 }}>Atrasos: {data.total}</p>
        </div>
      );
    }
    return null;
  };
  

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <DetailModal />
      
      <div className="dashboard-header">
        <Row className="align-items-center">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="dashboard-title">Panel de Control - Atrasos</h1>
              
            </div>
            <p className="dashboard-subtitle">
              Estadísticas actualizadas al {new Date().toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </Col>
        </Row>
        
        <Row className="stats-container mt-4">
          <Col md={3} sm={6}>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Total de atrasos registrados hoy</Tooltip>}
            >
              <div className="stats-item">
                <div className="stats-icon">
                  <FaClock />
                </div>
                <div className="stats-content">
                  <h3>{todayCount}</h3>
                  <p>Atrasos Registrados Hoy</p>
                  <small className="stats-trend">
                    {todayCount > 0 ? `${((todayCount / (weekCount/7)) * 100).toFixed(1)}% vs. promedio diario` : 'Sin registros hoy'}
                  </small>
                </div>
              </div>
            </OverlayTrigger>
          </Col>
          <Col md={3} sm={6}>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Total de atrasos registrados esta semana</Tooltip>}
            >
              <div className="stats-item">
                <div className="stats-icon">
                  <FaCalendarAlt />
                </div>
                <div className="stats-content">
                  <h3>{weekCount}</h3>
                  <p>Atrasos Esta Semana</p>
                  <small className="stats-trend">
                    Promedio: {(weekCount/7).toFixed(1)} por día
                  </small>
                </div>
              </div>
            </OverlayTrigger>
          </Col>
          <Col md={3} sm={6}>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Total de atrasos registrados este mes</Tooltip>}
            >
              <div className="stats-item">
                <div className="stats-icon">
                  <FaChartLine />
                </div>
                <div className="stats-content">
                  <h3>{monthCount}</h3>
                  <p>Atrasos Este Mes</p>
                  <small className="stats-trend">
                    Promedio: {(monthCount/30).toFixed(1)} por día
                  </small>
                </div>
              </div>
            </OverlayTrigger>
          </Col>
          <Col md={3} sm={6}>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Total de atrasos registrados en el historico</Tooltip>}
            >
              <div className="stats-item">
                <div className="stats-icon">
                  <FaExclamation />
                </div>
                <div className="stats-content">
                  <h3>{tardiness.length}</h3>
                  <p>Total Histórico</p>
                  <small className="stats-trend">
                    Desde el inicio del registro
                  </small>
                </div>
              </div>
            </OverlayTrigger>
          </Col>
        </Row>
      </div>
      <Card className="filter-card">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>
              <FaFilter className="me-2" />
              Filtros
            </Card.Title>
            <div>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => setShowSaveFilterModal(true)}
              >
                <FaSave className="me-2" />
                Guardar Filtro
              </Button>
              {savedFilters.length > 0 && (
                <Form.Select 
                  className="d-inline-block" 
                  style={{width: 'auto'}}
                  onChange={(e) => {
                    if (e.target.value) {
                      applySavedFilter(savedFilters[e.target.value]);
                    }
                  }}
                >
                  <option value="">Filtros guardados</option>
                  {savedFilters.map((filter, index) => (
                    <option key={index} value={index}>{filter.name}</option>
                  ))}
                </Form.Select>
              )}
            </div>
          </div>
          <Row>
            <Col md={3}>
              <div className="filter-group">
                <FaSchool className="filter-icon" />
                <Form.Select
                  className="filter-select"
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
              </div>
            </Col>
            <Col md={3}>
              <div className="filter-group">
                <FaUserGraduate className="filter-icon" />
                <Form.Select
                  className="filter-select"
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
              </div>
            </Col>
            <Col md={3}>
              <div className="filter-group">
                <FaCalendarAlt className="filter-icon" />
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  locale={es}
                  dateFormat="dd/MM/yyyy"
                  className="form-control filter-select"
                  placeholderText="Fecha inicio"
                />
              </div>
            </Col>
            <Col md={3}>
              <div className="filter-group">
                <FaCalendarAlt className="filter-icon" />
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  locale={es}
                  dateFormat="dd/MM/yyyy"
                  className="form-control filter-select"
                  placeholderText="Fecha fin"
                />
              </div>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button 
                variant="primary"
                onClick={handleApplyFilters}
                disabled={isFiltering}
                className="me-2"
              >
                <FaFilter className="me-2" />
                {isFiltering ? 'Aplicando...' : 'Aplicar Filtros'}
              </Button>
              <Button 
                variant="outline-secondary"
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
      <Row className="mb-4">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body>
              <h3 className="chart-title">
                Tendencia de Atrasos por Día
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Distribución de atrasos por día de la semana</Tooltip>}
                >
                  <FaInfoCircle className="ms-2" />
                </OverlayTrigger>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weekdayStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="total" fill="#1a73e8" stroke="#1a73e8" />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body>
              <h3 className="chart-title">
                Distribución por Hora
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Cantidad de atrasos por hora del día</Tooltip>}
                >
                  <FaInfoCircle className="ms-2" />
                </OverlayTrigger>
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="total" stroke="#34a853" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showSaveFilterModal} onHide={() => setShowSaveFilterModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Guardar Filtro</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nombre del filtro</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese un nombre para el filtro"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveFilterModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveFilter}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      <Row>
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body>
              <h3 className="chart-title">Atrasos por Curso</h3>
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
                 <RechartsTooltip />
                 <Legend />
               </PieChart>
              </ResponsiveContainer>

            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
        
        <Card className="chart-card">
          <Card.Body>
            <h3 className="chart-title">Top 5 Estudiantes con más Atrasos</h3>
            <ResponsiveContainer width="100%" height={300}>
                        <BarChart
               data={topStudentsWithNames || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
             >
                <CartesianGrid strokeDasharray="3 3" />
                {/* Usamos "name" para que se muestre el nombre en el tooltip */}
               <XAxis 
                 dataKey="name" 
                 tick={{ fontSize: 10 }}
                 /* Opcional: si quieres formatear el texto, puedes hacerlo aquí */
                />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name, props) => [value, 'Atrasos']}
                  labelFormatter={(value) => {
                    const student = topStudentsWithNames.find(s => s.rut === value);
                    return `Estudiante: ${student ? student.name : value}`;
                  }}
                />

                <Legend />
               <Bar dataKey="total" fill="#0070ff" name="Atrasos" />
              </BarChart>
            </ResponsiveContainer>
         </Card.Body>
        </Card>
        


        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="chart-title mb-0">
              Registros de Atrasos
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>
                  Promedio de minutos de atraso: {averageDelay.toFixed(1)} minutos
                </Tooltip>}
              >
                <FaInfoCircle className="ms-2" />
              </OverlayTrigger>
            </h3>
            <div>
              <Button 
                variant="outline-primary"
                className="me-2"
                onClick={exportToPDF}
              >
                <FaDownload className="me-2" />
                Exportar a PDF
              </Button>
              <Button 
                className="export-button"
                onClick={exportToExcel}
                disabled={filteredTardiness.length === 0}
              >
                <FaDownload className="me-2" />
                Exportar a Excel
              </Button>
            </div>
          </div>

          {isLoading || isFiltering ? (
            <div className="loading-overlay">
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Curso</th>
                      <th>Estudiante</th>
                      <th>Motivo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index} onClick={() => showRecordDetails(record)} style={{cursor: 'pointer'}}>
                          <td>{new Date(record.fecha).toLocaleDateString()}</td>
                          <td>{record.hora}</td>
                          <td>{record.curso}</td>
                          <td>{getStudentName(record.studentRut)}</td>
                          <td>{record.motivo}</td>
                          <td>
                            <Button 
                              variant="link" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                showRecordDetails(record);
                              }}
                            >
                              <FaSearch />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No se encontraron registros
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <Button
                    variant="link"
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                  >
                    Primera
                  </Button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <Button
                    variant="link"
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Última
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
