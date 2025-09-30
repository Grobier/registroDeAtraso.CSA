// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, OverlayTrigger, Tooltip, Modal, Badge } from 'react-bootstrap';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';
import * as XLSX from 'xlsx';
import { FaCalendarAlt, FaUserGraduate, FaSchool, FaDownload, FaFilter, FaClock, FaChartLine, FaExclamation, FaInfoCircle, FaSearch, FaSave, FaTrash } from 'react-icons/fa';
import './Dashboard.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment-timezone';


const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'http://localhost:5000' : '');


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

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [averageDelay, setAverageDelay] = useState(0);
  const [weekdayStats, setWeekdayStats] = useState([]);
  const [timeStats, setTimeStats] = useState([]);
  const [statsByDay, setStatsByDay] = useState([]);

  // Estados para los modales de puntualidad
  const [showPunctualityModal, setShowPunctualityModal] = useState(false);
  const [selectedPunctualityCategory, setSelectedPunctualityCategory] = useState('');
  const [selectedPunctualityStudents, setSelectedPunctualityStudents] = useState([]);

  // Estados para el modal de estadísticas detalladas
  const [showTodayStatsModal, setShowTodayStatsModal] = useState(false);
  const [todayStats, setTodayStats] = useState(null);

  // Estado para el reloj
  const [currentTime, setCurrentTime] = useState(new Date());
  const today = new Date();



  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#46bdc6'];

  // Función para abrir el modal de puntualidad
  const openPunctualityModal = (category, categoryName) => {
    const studentsInCategory = getStudentsByPunctualityCategory(category);
    setSelectedPunctualityCategory(categoryName);
    setSelectedPunctualityStudents(studentsInCategory);
    setShowPunctualityModal(true);
  };

  // Función para obtener estudiantes de una categoría de puntualidad específica
  const getStudentsByPunctualityCategory = (category) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const workingDays = [20, 20, 20, 21, 19, 12, 18, 20, 17, 21, 20, 9][currentMonth - 1] || 20;
      
      if (!students || students.length === 0) return [];
      
      return students.filter(student => {
        const studentTardiness = tardiness.filter(record => 
          record.studentRut === student.rut && 
          new Date(record.fecha).getMonth() + 1 === currentMonth &&
          new Date(record.fecha).getFullYear() === 2025
        ).length;
        
        const studentPercentage = workingDays > 0 ? Math.round(((workingDays - studentTardiness) / workingDays) * 100) : 100;
        
        switch (category) {
          case 'excelente':
            return studentPercentage >= 90;
          case 'bueno':
            return studentPercentage >= 75 && studentPercentage < 90;
          case 'regular':
            return studentPercentage >= 60 && studentPercentage < 75;
          case 'necesita-mejora':
            return studentPercentage < 60;
          default:
            return false;
        }
      }).map(student => {
        const studentTardiness = tardiness.filter(record => 
          record.studentRut === student.rut && 
          new Date(record.fecha).getMonth() + 1 === currentMonth &&
          new Date(record.fecha).getFullYear() === 2025
        ).length;
        
        const studentPercentage = workingDays > 0 ? Math.round(((workingDays - studentTardiness) / workingDays) * 100) : 100;
        
        return {
          ...student,
          name: `${student.nombres} ${student.apellidosPaterno}`,
          punctualityPercentage: studentPercentage,
          tardinessCount: studentTardiness,
          workingDays: workingDays
        };
      }).sort((a, b) => b.punctualityPercentage - a.punctualityPercentage);
    } catch (error) {
      console.error('Error al obtener estudiantes por categoría:', error);
      return [];
    }
  };

  // Función para calcular la puntualidad institucional por mes
  const calculateInstitutionalPunctuality = () => {
    try {
      // Días hábiles por mes
      const workingDaysByMonth = {
        1: 20, 2: 20, 3: 20, 4: 21, 5: 19, 6: 12,
        7: 18, 8: 20, 9: 17, 10: 21, 11: 20, 12: 9
      };
      
      const monthlyData = [];
      
      for (let month = 1; month <= 12; month++) {
        const workingDays = workingDaysByMonth[month];
        const monthTardiness = tardiness.filter(record => {
          try {
            const recordDate = new Date(record.fecha);
            return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === 2025;
          } catch (error) {
            return false;
          }
        });
        
        const tardinessCount = monthTardiness.length;
        const punctualDays = workingDays - tardinessCount;
        const percentage = workingDays > 0 ? Math.round((punctualDays / workingDays) * 100) : 100;
        
        monthlyData.push({
          month: month,
          monthName: new Date(2025, month - 1, 1).toLocaleDateString('es-CL', { month: 'short' }),
          workingDays,
          tardiness: tardinessCount,
          punctualDays,
          percentage,
          color: percentage >= 90 ? '#34a853' : percentage >= 75 ? '#fbbc04' : percentage >= 60 ? '#ea4335' : '#d93025'
        });
      }
      
      return monthlyData;
    } catch (error) {
      console.warn('Error calculando puntualidad institucional:', error);
      return [];
    }
  };

  // Función para calcular estadísticas de puntualidad por curso
  const calculateCoursePunctuality = useMemo(() => {
    try {
      if (!courseStats || !students) return [];
      
      const coursePunctualityData = courseStats.map(course => {
        const courseStudents = students.filter(student => student.curso === course._id);
        const totalStudents = courseStudents.length;
        
        if (totalStudents === 0) return null;
        
        // Obtener todos los atrasos del curso en el mes actual
        const currentMonth = new Date().getMonth() + 1;
        const courseTardinessRecords = tardiness.filter(record => 
          record.curso === course._id && 
          new Date(record.fecha).getMonth() + 1 === currentMonth
        );
        
        // Contar estudiantes únicos que llegaron tarde (no días con atrasos)
        const studentsWithTardiness = new Set();
        courseTardinessRecords.forEach(record => {
          studentsWithTardiness.add(record.studentRut);
        });
        
        const studentsWithTardinessCount = studentsWithTardiness.size;
        const studentsPunctual = totalStudents - studentsWithTardinessCount;
        
        // Calcular puntualidad del curso: (estudiantes puntuales / total estudiantes) × 100
        const coursePunctuality = totalStudents > 0 
          ? Math.round((studentsPunctual / totalStudents) * 100) 
          : 100;
        
        // Determinar calificación del curso
        let grade, color;
        if (coursePunctuality >= 90) {
          grade = 'Excelente';
          color = '#28a745'; // Verde brillante
        } else if (coursePunctuality >= 75) {
          grade = 'Bueno';
          color = '#17a2b8'; // Azul turquesa
        } else if (coursePunctuality >= 60) {
          grade = 'Regular';
          color = '#fd7e14'; // Naranja
        } else {
          grade = 'Necesita mejora';
          color = '#dc3545'; // Rojo
        }
        
        return {
          course: course._id,
          totalStudents,
          totalTardiness: course.total,
          studentsWithTardiness: studentsWithTardinessCount, // Nueva: cantidad de estudiantes atrasados
          averagePunctuality: coursePunctuality, // Puntualidad por porcentaje de estudiantes puntuales
          grade,
          color
        };
      }).filter(Boolean);
      
      // Ordenar por puntualidad del curso (descendente)
      const sortedData = coursePunctualityData.sort((a, b) => b.averagePunctuality - a.averagePunctuality);
      
      // Debug: mostrar los datos calculados (solo una vez)
      console.log('Datos de puntualidad por curso calculados:', sortedData);
      
      return sortedData;
    } catch (error) {
      console.warn('Error calculando puntualidad por curso:', error);
      return [];
    }
  }, [courseStats, students, tardiness]);

  // Función para obtener datos
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tardiness/statistics`, { withCredentials: true })
      ]);

      setTardiness(statsRes.data.allTardiness);
      setStudentStats(statsRes.data.statsByStudent);
      setCourseStats(statsRes.data.statsByCourse);
      setStatsByDay(statsRes.data.statsByDay || []);
      
      axios.get(`${API_BASE_URL}/api/students`, { withCredentials: true })
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
    axios.get(`${API_BASE_URL}/api/students/curso`, { withCredentials: true })
      .then(response => setCourses(response.data))
      .catch(err => console.error(err));
  
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      axios.get(`${API_BASE_URL}/api/students`, {
        params: { curso: selectedCourse },
        withCredentials: true
      })
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

  const filteredTardiness = useMemo(() => (
    tardiness && tardiness.length > 0 ? tardiness.filter(record => {
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
    }) : []
  ), [tardiness, appliedFilters]);

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
    if (tardiness.length > 0) {
      // Estadísticas por día de la semana
      // Alinear con getDay(): 0=Domingo, 1=Lunes, ..., 6=Sábado
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const stats = new Array(7).fill(0);
      tardiness.forEach(record => {
        const date = new Date(record.fecha);
        stats[date.getDay()]++;
      });
      // Solo lunes a viernes (índices 1 a 5)
      setWeekdayStats(
        weekdays.slice(1, 6).map((day, index) => ({
          name: day,
          total: stats[index + 1]
        }))
      );

      // Estadísticas por hora y minuto exactos
      const timeRanges = {};
      tardiness.forEach(record => {
        // Usa hora y minutos exactos
        const [h, m] = record.hora.split(":");
        const label = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        timeRanges[label] = (timeRanges[label] || 0) + 1;
      });
      const timeStatsArr = Object.entries(timeRanges).map(([label, count]) => ({
        hour: label,
        total: count
      })).sort((a, b) => a.hour.localeCompare(b.hour));
      setTimeStats(timeStatsArr);

      // Promedio de minutos de atraso
      const totalMinutes = tardiness.reduce((acc, record) => {
        const [hours, minutes] = record.hora.split(':').map(Number);
        return acc + (hours * 60 + minutes - 480);
      }, 0);
      setAverageDelay(totalMinutes / tardiness.length);

      // Estadísticas de clima y conteos
      setWeatherData({
        temp: '18°C',
        condition: 'Parcialmente nublado',
        icon: <FaClock />
      });
      // Eliminado el useEffect anidado aquí
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
    }
  }, [tardiness]);

  // useEffect para actualizar el conteo de atrasos de hoy usando endpoint específico
  useEffect(() => {
    const fetchTodayStats = async () => {
      console.log('🔄 Iniciando fetchTodayStats...');
      try {
        console.log('🌐 Llamando a:', `${API_BASE_URL}/api/tardiness/statistics/today`);
        const response = await axios.get(`${API_BASE_URL}/api/tardiness/statistics/today`, { 
          withCredentials: true 
        });
        console.log('✅ Respuesta del endpoint:', response.data);
        setTodayCount(response.data.stats.total);
        setTodayStats(response.data); // Almacenar datos completos para el modal
        console.log('📊 Atrasos de hoy establecidos en:', response.data.stats.total);
      } catch (error) {
        console.error('❌ Error obteniendo estadísticas de hoy:', error);
        console.log('🔄 Usando método fallback...');
        // Fallback al método anterior
        const hoyChile = moment().tz('America/Santiago').format('YYYY-MM-DD');
        console.log('📅 Fecha de hoy (Chile):', hoyChile);
        const hoyObj = statsByDay.find(d => d._id === hoyChile);
        console.log('📊 Objeto encontrado:', hoyObj);
        const fallbackCount = hoyObj ? hoyObj.total : 0;
        console.log('📊 Contador fallback:', fallbackCount);
        setTodayCount(fallbackCount);
        setTodayStats(null);
      }
    };
    
    fetchTodayStats();
  }, [statsByDay]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTardiness.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTardiness.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const calculateWeekdayStats = () => {
    // Alinear con getDay(): 0=Domingo, 1=Lunes, ..., 6=Sábado
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const stats = new Array(7).fill(0);
    tardiness.forEach(record => {
      const date = new Date(record.fecha);
      stats[date.getDay()]++;
    });
    // Solo lunes a viernes (índices 1 a 5)
    setWeekdayStats(
      weekdays.slice(1, 6).map((day, index) => ({
        name: day,
        total: stats[index + 1]
      }))
    );
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
    console.log("Abriendo modal", record);
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  useEffect(() => {
    if (tardiness.length > 0) {
      calculateWeekdayStats();
      
      const totalMinutes = tardiness.reduce((acc, record) => {
        const [hours, minutes] = record.hora.split(':').map(Number);
        return acc + (hours * 60 + minutes - 480);
      }, 0);
      setAverageDelay(totalMinutes / tardiness.length);
    }
  }, [tardiness]);

  const DetailModal = () => (
    <Modal show={showDetailModal} onHide={() => { console.log("Cerrando modal"); setShowDetailModal(false); }} centered backdrop="static">
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

  // Limitar a los 6 cursos principales y agrupar el resto como "Otros"
  const maxCursos = 6;
  let dataCursos = courseStats || [];
  if (dataCursos.length > maxCursos) {
    const top = dataCursos.slice(0, maxCursos);
    const otros = dataCursos.slice(maxCursos);
    const totalOtros = otros.reduce((sum, item) => sum + item.total, 0);
    top.push({ _id: 'Otros', total: totalOtros });
    dataCursos = top;
  }

  return (
            <div className="dashboard-container">
      {/* Reloj digital en la parte superior */}
      <Clock />
      

      
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
              overlay={<Tooltip>Click para ver detalles de atrasos de hoy</Tooltip>}
            >
              <div 
                className="stats-item" 
                style={{ cursor: 'pointer' }}
                onClick={() => setShowTodayStatsModal(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                }}
              >
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


      {/* Resumen de Puntualidad Institucional */}
      <Row className="mb-4">
        <Col>
          <Card className="chart-card">
            <Card.Body>
              <h3 className="chart-title">
                📊 Resumen de Puntualidad Institucional - {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
              </h3>
                             <Row>
                                  <Col md={3} sm={6} className="mb-3">
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          <strong>Estudiantes con Puntualidad Excelente (90-100%)</strong><br/>
                          <em>Se calcula contando cuántos estudiantes individuales mantuvieron una puntualidad del 90% o superior durante el mes.</em><br/><br/>
                          <strong>Fórmula:</strong> (Días hábiles - Días con atrasos del estudiante) / Días hábiles × 100<br/><br/>
                          <strong>Ejemplo:</strong> Si un estudiante tuvo 2 atrasos en 20 días hábiles: (20-2)/20 × 100 = 90%
                        </Tooltip>
                      }
                    >
                      <div 
                        className="text-center p-3 bg-success bg-opacity-10 rounded border"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openPunctualityModal('excelente', 'Excelentes (90-100%)')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#d4edda'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = ''}
                      >
                         <h4 className="text-success mb-1">
                           {(() => {
                             const currentMonth = new Date().getMonth() + 1;
                             const workingDays = [20, 20, 20, 21, 19, 12, 18, 20, 17, 21, 20, 9][currentMonth - 1] || 20;
                             
                             // Contar estudiantes con puntualidad excelente (90-100%)
                             if (!students || students.length === 0) return 0;
                             
                             return students.filter(student => {
                               const studentTardiness = tardiness.filter(record => 
                                 record.studentRut === student.rut && 
                                 new Date(record.fecha).getMonth() + 1 === currentMonth &&
                                 new Date(record.fecha).getFullYear() === 2025
                               ).length;
                               
                               const studentPercentage = workingDays > 0 ? Math.round(((workingDays - studentTardiness) / workingDays) * 100) : 100;
                               return studentPercentage >= 90;
                             }).length;
                           })()}
                         </h4>
                         <p className="text-success mb-0 fw-bold">🟢 Excelentes (90-100%)</p>
                         <small className="text-muted">Click para ver detalles</small>
                       </div>
                    </OverlayTrigger>
                  </Col>
                                  <Col md={3} sm={6} className="mb-3">
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          <strong>Estudiantes con Puntualidad Buena (75-89%)</strong><br/>
                          <em>Se calcula contando cuántos estudiantes individuales mantuvieron una puntualidad entre el 75% y 89% durante el mes.</em><br/><br/>
                          <strong>Fórmula:</strong> (Días hábiles - Días con atrasos del estudiante) / Días hábiles × 100<br/><br/>
                          <strong>Ejemplo:</strong> Si un estudiante tuvo 4 atrasos en 20 días hábiles: (20-4)/20 × 100 = 80%
                        </Tooltip>
                      }
                    >
                      <div 
                        className="text-center p-3 bg-warning bg-opacity-10 rounded border"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openPunctualityModal('bueno', 'Buenos (75-89%)')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fff3cd'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = ''}
                      >
                         <h4 className="text-warning mb-1">
                           {(() => {
                             const currentMonth = new Date().getMonth() + 1;
                             const workingDays = [20, 20, 20, 21, 19, 12, 18, 20, 17, 21, 20, 9][currentMonth - 1] || 20;
                             
                             // Contar estudiantes con puntualidad buena (75-89%)
                             if (!students || students.length === 0) return 0;
                             
                             return students.filter(student => {
                               const studentTardiness = tardiness.filter(record => 
                                 record.studentRut === student.rut && 
                                 new Date(record.fecha).getMonth() + 1 === currentMonth &&
                                 new Date(record.fecha).getFullYear() === 2025
                               ).length;
                               
                               const studentPercentage = workingDays > 0 ? Math.round(((workingDays - studentTardiness) / workingDays) * 100) : 100;
                               return studentPercentage >= 75 && studentPercentage < 90;
                             }).length;
                           })()}
                         </h4>
                         <p className="text-warning mb-0 fw-bold">🟡 Buenos (75-89%)</p>
                         <small className="text-muted">Click para ver detalles</small>
                       </div>
                    </OverlayTrigger>
                  </Col>
                                  <Col md={3} sm={6} className="mb-3">
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          <strong>Estudiantes con Puntualidad Regular (60-74%)</strong><br/>
                          <em>Se calcula contando cuántos estudiantes individuales mantuvieron una puntualidad entre el 60% y 74% durante el mes.</em><br/><br/>
                          <strong>Fórmula:</strong> (Días hábiles - Días con atrasos del estudiante) / Días hábiles × 100<br/><br/>
                          <strong>Ejemplo:</strong> Si un estudiante tuvo 6 atrasos en 20 días hábiles: (20-6)/20 × 100 = 70%
                        </Tooltip>
                      }
                    >
                      <div 
                        className="text-center p-3 bg-info bg-opacity-10 rounded border"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openPunctualityModal('regular', 'Regulares (60-74%)')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#d1ecf1'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = ''}
                      >
                         <h4 className="text-info mb-1">
                           {(() => {
                             const currentMonth = new Date().getMonth() + 1;
                             const workingDays = [20, 20, 20, 21, 19, 12, 18, 20, 17, 21, 20, 9][currentMonth - 1] || 20;
                             
                             // Contar estudiantes con puntualidad regular (60-74%)
                             if (!students || students.length === 0) return 0;
                             
                             return students.filter(student => {
                               const studentTardiness = tardiness.filter(record => 
                                 record.studentRut === student.rut && 
                                 new Date(record.fecha).getMonth() + 1 === currentMonth &&
                                 new Date(record.fecha).getFullYear() === 2025
                               ).length;
                               
                               const studentPercentage = workingDays > 0 ? Math.round(((workingDays - studentTardiness) / workingDays) * 100) : 100;
                               return studentPercentage >= 60 && studentPercentage < 75;
                             }).length;
                           })()}
                         </h4>
                         <p className="text-info mb-0 fw-bold">🟠 Regulares (60-74%)</p>
                         <small className="text-muted">Click para ver detalles</small>
                       </div>
                    </OverlayTrigger>
                  </Col>
                                  <Col md={3} sm={6} className="mb-3">
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          <strong>Estudiantes que Necesitan Mejora (&lt;60%)</strong><br/>
                          <em>Se calcula contando cuántos estudiantes individuales tuvieron una puntualidad menor al 60% durante el mes.</em><br/><br/>
                          <strong>Fórmula:</strong> (Días hábiles - Días con atrasos del estudiante) / Días hábiles × 100<br/><br/>
                          <strong>Ejemplo:</strong> Si un estudiante tuvo 9 atrasos en 20 días hábiles: (20-9)/20 × 100 = 55%
                        </Tooltip>
                      }
                    >
                      <div 
                        className="text-center p-3 bg-danger bg-opacity-10 rounded border"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openPunctualityModal('necesita-mejora', 'Necesitan Mejora (<60%)')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8d7da'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = ''}
                      >
                         <h4 className="text-danger mb-1">
                           {(() => {
                             const currentMonth = new Date().getMonth() + 1;
                             const workingDays = [20, 20, 20, 21, 19, 12, 18, 20, 17, 21, 20, 9][currentMonth - 1] || 20;
                             
                             // Contar estudiantes con puntualidad que necesita mejora (<60%)
                             if (!students || students.length === 0) return 0;
                             
                             return students.filter(student => {
                               const studentTardiness = tardiness.filter(record => 
                                 record.studentRut === student.rut && 
                                 new Date(record.fecha).getMonth() + 1 === currentMonth &&
                                 new Date(record.fecha).getFullYear() === 2025
                               ).length;
                               
                               const studentPercentage = workingDays > 0 ? Math.round(((workingDays - studentTardiness) / workingDays) * 100) : 100;
                               return studentPercentage < 60;
                             }).length;
                           })()}
                         </h4>
                         <p className="text-danger mb-0 fw-bold">🔴 Necesitan Mejora (&lt;60%)</p>
                         <small className="text-muted">Click para ver detalles</small>
                       </div>
                    </OverlayTrigger>
                  </Col>
               </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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

      {/* Gráfico de Evolución Mensual de Puntualidad Institucional */}
      <Row className="mb-4">
        <Col>
          <Card className="chart-card">
            <Card.Body>
              <h3 className="chart-title">
                📈 Evolución Mensual de Puntualidad Institucional - 2025
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={calculateInstitutionalPunctuality()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Bar dataKey="percentage" fill="#1a73e8" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

             {/* Criterios de Calificación */}
       <Row className="mb-4">
         <Col>
           <Card className="chart-card">
             <Card.Body>
               <h3 className="chart-title">
                 📋 Criterios de Calificación por Puntualidad
               </h3>
               <div className="table-responsive">
                 <Table striped bordered hover>
                   <thead>
                     <tr>
                       <th className="text-center">Calificación</th>
                       <th className="text-center">Rango de Puntualidad</th>
                       <th className="text-center">Descripción</th>
                       <th className="text-center">Color</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td className="text-center">
                         <Badge bg="success" style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>
                           Excelente
                         </Badge>
                       </td>
                       <td className="text-center">
                         <strong>90% - 100%</strong>
                       </td>
                       <td>El curso mantiene una puntualidad sobresaliente, con la mayoría de estudiantes llegando a tiempo</td>
                       <td className="text-center">
                         <div style={{ width: '20px', height: '20px', backgroundColor: '#198754', borderRadius: '50%', margin: '0 auto' }}></div>
                       </td>
                     </tr>
                     <tr>
                       <td className="text-center">
                         <Badge bg="warning" style={{ fontSize: '1rem', color: 'black', fontWeight: 'bold' }}>
                           Bueno
                         </Badge>
                       </td>
                       <td className="text-center">
                         <strong>75% - 89%</strong>
                       </td>
                       <td>El curso mantiene una buena puntualidad, con algunos casos de atrasos ocasionales</td>
                       <td className="text-center">
                         <div style={{ width: '20px', height: '20px', backgroundColor: '#ffc107', borderRadius: '50%', margin: '0 auto' }}></div>
                       </td>
                     </tr>
                     <tr>
                       <td className="text-center">
                         <Badge bg="info" style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>
                           Regular
                         </Badge>
                       </td>
                       <td className="text-center">
                         <strong>60% - 74%</strong>
                       </td>
                       <td>El curso tiene una puntualidad aceptable pero con espacio para mejorar</td>
                       <td className="text-center">
                         <div style={{ width: '20px', height: '20px', backgroundColor: '#0dcaf0', borderRadius: '50%', margin: '0 auto' }}></div>
                       </td>
                     </tr>
                     <tr>
                       <td className="text-center">
                         <Badge bg="danger" style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>
                           Necesita Mejora
                         </Badge>
                       </td>
                       <td className="text-center">
                         <strong>0% - 59%</strong>
                       </td>
                       <td>El curso requiere atención inmediata para mejorar la puntualidad de los estudiantes</td>
                       <td className="text-center">
                         <div style={{ width: '20px', height: '20px', backgroundColor: '#dc3545', borderRadius: '50%', margin: '0 auto' }}></div>
                       </td>
                     </tr>
                   </tbody>
                 </Table>
               </div>
               
             </Card.Body>
           </Card>
         </Col>
       </Row>

               {/* Ranking de Cursos por Puntualidad */}
        <Row className="mb-4">
          <Col>
            <Card className="chart-card">
              <Card.Body>
                <h3 className="chart-title">
                  🏆 Ranking de Cursos por Puntualidad - {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </h3>
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando datos de puntualidad...</p>
                  </div>
                ) : calculateCoursePunctuality.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-muted">No hay datos de puntualidad disponibles</p>
                    <small className="text-muted">Debug: courseStats={courseStats?.length || 0}, students={students?.length || 0}, tardiness={tardiness?.length || 0}</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Posición</th>
                          <th>Curso</th>
                          <th>Total Estudiantes</th>
                          <th>Total Atrasos</th>
                          <th>Estudiantes Atrasados</th>
                          <th>Puntualidad Promedio</th>
                          <th>Calificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          console.log('Renderizando tabla con datos:', calculateCoursePunctuality);
                          return calculateCoursePunctuality.map((course, index) => (
                          <tr key={course.course}>
                            <td className="text-center">
                              <Badge 
                                bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'dark' : 'light'}
                                style={{ 
                                  color: index === 0 ? '#000' : index === 1 ? '#fff' : index === 2 ? '#fff' : '#000',
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {index + 1}°
                              </Badge>
                            </td>
                            <td><strong>{course.course}</strong></td>
                            <td className="text-center">{course.totalStudents}</td>
                            <td className="text-center">
                              <Badge 
                                style={{ 
                                  backgroundColor: '#dc3545', 
                                  color: 'white', 
                                  fontSize: '0.9rem', 
                                  fontWeight: 'bold',
                                  border: '2px solid #c82333',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                }}
                              >
                                {course.totalTardiness}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge 
                                style={{ 
                                  backgroundColor: '#fd7e14', 
                                  color: 'white', 
                                  fontSize: '0.9rem', 
                                  fontWeight: 'bold',
                                  border: '2px solid #e67700',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                }}
                              >
                                {course.studentsWithTardiness}
                              </Badge>
                            </td>
                                                         <td className="text-center">
                               <Badge 
                                 style={{ 
                                   fontSize: '1rem', 
                                   color: 'white', 
                                   fontWeight: 'bold',
                                   backgroundColor: course.color,
                                   border: course.averagePunctuality >= 75 && course.averagePunctuality < 90 ? '2px solid #138496' : course.averagePunctuality >= 60 && course.averagePunctuality < 75 ? '2px solid #e67700' : 'none',
                                   textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                   minWidth: '60px',
                                   display: 'inline-block'
                                 }}
                               >
                                 {course.averagePunctuality}%
                               </Badge>
                             </td>
                                                         <td className="text-center">
                               <Badge 
                                 style={{ 
                                   fontSize: '0.9rem',
                                   fontWeight: 'bold',
                                   color: 'white',
                                   backgroundColor: course.color,
                                   border: course.averagePunctuality >= 75 && course.averagePunctuality < 90 ? '2px solid #138496' : course.averagePunctuality >= 60 && course.averagePunctuality < 75 ? '2px solid #e67700' : 'none',
                                   textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                   minWidth: '80px',
                                   display: 'inline-block'
                                 }}
                               >
                                 {course.grade}
                               </Badge>
                             </td>
                         </tr>
                       ));
                       })()}
                     </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

      <Row>
        <Col md={6}>
          <Card className="chart-card">
            <Card.Body>
              <h3 className="chart-title">Atrasos por Curso</h3>
              <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                  <Pie
                   data={dataCursos}
                    dataKey="total"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                 >
                   {dataCursos && dataCursos.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip />
               </PieChart>
              </ResponsiveContainer>

            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
        
        <Card className="chart-card">
          <Card.Body>
            <h3 className="chart-title">Top 5 Estudiantes con más Atrasos</h3>
            <ResponsiveContainer width="100%" height={250}>
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

      {/* Modal para mostrar estudiantes por categoría de puntualidad */}
      <Modal 
        show={showPunctualityModal} 
        onHide={() => setShowPunctualityModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            📊 {selectedPunctualityCategory} - {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPunctualityStudents.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estudiante</th>
                    <th>Curso</th>
                    <th>Puntualidad</th>
                    <th>Atrasos</th>
                    <th>Días Hábiles</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPunctualityStudents.map((student, index) => (
                    <tr key={student.rut}>
                      <td className="text-center">
                        <Badge 
                          bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'dark' : 'light'}
                          style={{ 
                            color: index === 0 ? '#000' : index === 1 ? '#fff' : index === 2 ? '#fff' : '#000',
                            fontWeight: 'bold'
                          }}
                        >
                          {index + 1}
                        </Badge>
                      </td>
                                             <td>
                         <strong>{student.name}</strong>
                         <br />
                         <small className="text-muted">RUT: {student.rut}</small>
                       </td>
                      <td className="text-center">
                        <Badge bg="info">{student.curso}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge 
                          style={{ 
                            fontSize: '1rem', 
                            color: 'white', 
                            fontWeight: 'bold',
                            backgroundColor: student.punctualityPercentage >= 90 ? '#28a745' : 
                                           student.punctualityPercentage >= 75 ? '#17a2b8' : 
                                           student.punctualityPercentage >= 60 ? '#fd7e14' : '#dc3545',
                            minWidth: '60px',
                            display: 'inline-block'
                          }}
                        >
                          {student.punctualityPercentage}%
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge 
                          style={{ 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold'
                          }}
                        >
                          {student.tardinessCount}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary">{student.workingDays}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted">No hay estudiantes en esta categoría</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPunctualityModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              // Aquí se podría implementar la exportación a Excel o PDF
              alert('Función de exportación próximamente disponible');
            }}
          >
            📊 Exportar Lista
          </Button>
        </Modal.Footer>
      </Modal>


      {/* Modal para estadísticas detalladas de hoy */}
      <Modal 
        show={showTodayStatsModal} 
        onHide={() => setShowTodayStatsModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            📊 Estadísticas Detalladas - {new Date().toLocaleDateString('es-CL', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            // Usar el estado de estadísticas de hoy si está disponible
            if (todayStats) {
              const stats = todayStats.stats;
              const todayTardiness = todayStats.tardiness;

              if (stats.total === 0) {
                return (
                  <div className="text-center p-5">
                    <div className="text-success mb-4">
                      <i className="fas fa-check-circle" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="text-success mb-3">¡Excelente!</h4>
                    <p className="text-muted mb-0 fs-5">No hay atrasos registrados hoy</p>
                    <small className="text-muted">Todos los estudiantes llegaron a tiempo</small>
                  </div>
                );
              }

            return (
              <div>
                {/* Resumen general */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="text-center border-0 shadow-sm h-100">
                      <Card.Body className="py-3">
                        <h3 className="text-primary mb-1" style={{ fontSize: '2rem' }}>{stats.total}</h3>
                        <p className="text-muted small mb-0">Total Atrasos</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center border-0 shadow-sm h-100">
                      <Card.Body className="py-3">
                        <h3 className="text-success mb-1" style={{ fontSize: '2rem' }}>{stats.withCertificate}</h3>
                        <p className="text-muted small mb-0">Con Certificado</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center border-0 shadow-sm h-100">
                      <Card.Body className="py-3">
                        <h3 className="text-danger mb-1" style={{ fontSize: '2rem' }}>{stats.withoutCertificate}</h3>
                        <p className="text-muted small mb-0">Sin Certificado</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center border-0 shadow-sm h-100">
                      <Card.Body className="py-3">
                        <h3 className="text-warning mb-1" style={{ fontSize: '2rem' }}>{stats.latePresent}</h3>
                        <p className="text-muted small mb-0">Atrasado-Presente</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Distribución por curso */}
                <Row className="mb-3">
                  <Col>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-light border-0 py-2">
                        <h6 className="mb-0 text-muted small">📚 Distribución por Curso</h6>
                      </Card.Header>
                      <Card.Body className="py-2">
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(stats.byCourse).map(([curso, count]) => (
                            <div key={curso} className="d-flex align-items-center" style={{ 
                              background: '#f8f9fa', 
                              borderRadius: '0.25rem',
                              border: '1px solid #e9ecef',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem'
                            }}>
                              <span className="fw-medium text-muted me-2">{curso}</span>
                              <span className="badge bg-primary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Distribución por hora */}
                <Row className="mb-3">
                  <Col>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-light border-0 py-2">
                        <h6 className="mb-0 text-muted small">🕐 Distribución por Hora</h6>
                      </Card.Header>
                      <Card.Body className="py-2">
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(stats.byHour)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([hour, count]) => (
                            <div key={hour} className="d-flex align-items-center" style={{ 
                              background: '#f8f9fa', 
                              borderRadius: '0.25rem',
                              border: '1px solid #e9ecef',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem'
                            }}>
                              <span className="fw-medium text-muted me-2">{hour}:00</span>
                              <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Lista detallada */}
                <Row>
                  <Col>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-light border-0 py-3">
                        <h6 className="mb-0 text-muted">📋 Lista Detallada de Atrasos</h6>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div className="table-responsive">
                          <Table className="mb-0" size="sm">
                            <thead className="bg-light">
                              <tr>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">#</th>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">Estudiante</th>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">Curso</th>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">Hora</th>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">Motivo</th>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">Cert.</th>
                                <th className="border-0 py-2 px-3 text-muted small fw-normal">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {todayTardiness.map((record, index) => {
                                const student = students.find(s => s.rut === record.studentRut);
                                const studentName = student ? `${student.nombres} ${student.apellidosPaterno}` : record.studentRut;
                                
                                return (
                                  <tr key={record._id} className="border-bottom">
                                    <td className="py-2 px-3 text-center">
                                      <span className="badge bg-light text-dark" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                        {index + 1}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="d-flex flex-column">
                                        <span className="fw-medium small">{studentName}</span>
                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{record.studentRut}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="badge bg-primary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                                        {record.curso}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                                        {record.hora}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                        {record.motivo.length > 30 ? `${record.motivo.substring(0, 30)}...` : record.motivo}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className={`badge ${record.trajoCertificado ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                                        {record.trajoCertificado ? 'Sí' : 'No'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className={`badge ${
                                        record.concepto === 'presente' ? 'bg-success' :
                                        record.concepto === 'atrasado-presente' ? 'bg-warning text-dark' :
                                        'bg-danger'
                                      }`} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                                        {record.concepto === 'presente' ? 'P' :
                                         record.concepto === 'atrasado-presente' ? 'A-P' :
                                         'A'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            );
          }

          // Fallback si no hay datos de hoy
          return (
            <div className="text-center py-4">
              <h5>Cargando estadísticas...</h5>
              <p className="text-muted">Obteniendo datos del día actual.</p>
            </div>
          );
        })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTodayStatsModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              // Aquí se podría implementar la exportación a Excel o PDF
              alert('Función de exportación próximamente disponible');
            }}
          >
            📊 Exportar Estadísticas
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

// Componente de reloj digital aislado
function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1a73e8' }}>
        {currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span style={{ marginLeft: 8, color: '#888', fontSize: '0.95rem' }}>
        {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </span>
    </div>
  );
}

export default Dashboard;
