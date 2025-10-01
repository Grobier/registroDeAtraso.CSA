// src/pages/Notifications.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Spinner, Badge, Breadcrumb, InputGroup, Pagination, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaUsers, FaChartBar, FaHistory, FaSearch, FaFilter, FaCalendarAlt, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Notifications.css';

// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

// Componente memoizado para filas de estudiantes - OPTIMIZACIÓN
const StudentRow = memo(({ 
  student, 
  isSelected, 
  onSelect, 
  getTardinessColor, 
  getConceptoColor, 
  getConceptoLabel,
  calculateMonthlyPunctuality,
  getCurrentMonth,
  getCurrentYear,
  handleShowDetails,
  handleShowPunctualityAnalysis 
}) => {
  // Memoizar la puntualidad mensual para evitar recálculos
  const punctuality = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();
    return calculateMonthlyPunctuality(student, currentMonth, currentYear);
  }, [student, getCurrentMonth, getCurrentYear, calculateMonthlyPunctuality]);

  return (
    <tr>
      <td>
        <Form.Check
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(student.rut, e.target.checked)}
        />
      </td>
      <td>{student.rut}</td>
      <td>
        {student.nombres} {student.apellidosPaterno} {student.apellidosMaterno}
      </td>
      <td>{student.curso}</td>
      <td>{student.correoApoderado}</td>
      <td>
        <Badge bg={getTardinessColor(student.totalAtrasos)}>
          {student.totalAtrasos}
        </Badge>
      </td>
      <td>
        {student.atrasos && student.atrasos.length > 0 ? (
          <div className="text-center">
            <div className="fw-bold text-primary">
              {new Date(student.atrasos[0].fecha).toLocaleDateString('es-CL')}
            </div>
            <small className="text-muted">
              {student.atrasos[0].hora}
            </small>
          </div>
        ) : (
          <small className="text-muted">N/A</small>
        )}
      </td>
      <td>
        {student.atrasos && student.atrasos.length > 0 ? (
          <div className="d-flex align-items-center gap-2">
            <Badge 
              bg={getConceptoColor(student.atrasos[0].concepto)}
              style={{ cursor: 'pointer' }}
              title="Click para ver todos los conceptos de atrasos"
            >
              {getConceptoLabel(student.atrasos[0].concepto)}
            </Badge>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleShowDetails(student)}
              title="Ver todos los conceptos"
              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
            >
              Ver
            </Button>
          </div>
        ) : (
          <small className="text-muted">N/A</small>
        )}
      </td>
      <td>
        <div className="text-center">
          <Badge 
            bg={punctuality.color} 
            className="mb-1 d-block"
            style={{ fontSize: '0.8rem' }}
          >
            {punctuality.percentage}%
          </Badge>
          <div className="small text-muted mb-1">
            {punctuality.grade}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleShowPunctualityAnalysis(student)}
            title="Ver análisis detallado de puntualidad"
            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
          >
            📊
          </Button>
        </div>
      </td>
    </tr>
  );
});

StudentRow.displayName = 'StudentRow';

// Componente de Loading Fullscreen - OPTIMIZACIÓN UX
const FullscreenLoading = memo(({ progress = 0 }) => {
  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999
      }}
    >
      <div className="text-center">
        {/* Logo del colegio */}
        <div className="mb-4">
          <img 
            src="/Logo.png" 
            alt="Colegio Saint Arieli" 
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              animation: 'logoFloat 2s ease-in-out infinite'
            }}
          />
        </div>
        
        {/* Spinner personalizado */}
        <div className="loading-spinner mb-3">
          <div className="spinner-ring"></div>
        </div>
        
        {/* Texto de carga */}
        <h4 className="text-primary mb-2">Cargando Notificaciones</h4>
        <p className="text-muted mb-0">
          <span className="loading-dots">Obteniendo datos de estudiantes</span>
        </p>
        
        {/* Barra de progreso real */}
        <div className="progress mt-3" style={{ width: '250px', height: '6px' }}>
          <div 
            className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
            role="progressbar" 
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          ></div>
        </div>
        <small className="text-muted mt-2 d-block">
          {progress < 30 ? 'Conectando con el servidor...' :
           progress < 60 ? 'Obteniendo datos de estudiantes...' :
           progress < 90 ? 'Procesando información...' :
           'Finalizando carga...'}
        </small>
      </div>
      
      {/* Estilos CSS integrados */}
      <style jsx>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes progressBar {
          0% { width: 0%; }
          20% { width: 25%; }
          40% { width: 45%; }
          60% { width: 65%; }
          80% { width: 85%; }
          100% { width: 100%; }
        }
        
        @keyframes loadingDots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
        
        .loading-spinner {
          position: relative;
          width: 60px;
          height: 60px;
          margin: 0 auto;
        }
        
        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .spinner-ring::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 4px solid transparent;
          border-top: 4px solid #6c757d;
          border-radius: 50%;
          animation: spin 1.5s linear infinite reverse;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-dots::after {
          content: '';
          animation: loadingDots 2s infinite;
        }
      `}</style>
    </div>
  );
});

FullscreenLoading.displayName = 'FullscreenLoading';

const Notifications = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showPunctualityModal, setShowPunctualityModal] = useState(false);
  const [selectedStudentPunctuality, setSelectedStudentPunctuality] = useState(null);
  const [emailForm, setEmailForm] = useState({
    asunto: 'Notificación de Atrasos - Estudiante',
    contenido: `Estimado apoderado,

Le informamos que su pupilo(a) {NOMBRE_ESTUDIANTE} del curso {CURSO} ha acumulado {TOTAL_ATRASOS} atraso(s) durante el período escolar.

Detalle de atrasos:
{DETALLE_ATRASOS}

Es importante que tome las medidas necesarias para evitar futuros atrasos, ya que esto puede afectar el rendimiento académico del estudiante.

Atentamente,
Equipo Directivo`
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para filtro y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minTardinessFilter, setMinTardinessFilter] = useState('');
  const [punctualityFilter, setPunctualityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  // Debounce para búsqueda - OPTIMIZACIÓN
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generar opciones de meses
  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  // Generar opciones de años (últimos 5 años)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Cargar estudiantes con atrasos al montar el componente
  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = async () => {
      try {
        const authResponse = await fetch(`${API_BASE_URL}/api/auth/check-auth`, {
          credentials: 'include'
        });
        
        if (authResponse.ok) {
          console.log('✅ Usuario autenticado, cargando estudiantes...');
          await loadStudentsWithTardiness(true);
        } else {
          console.log('❌ Usuario no autenticado');
          setMessage({ type: 'warning', text: 'Debe iniciar sesión para acceder a esta funcionalidad' });
          navigate('/login'); // Redirigir al login si no está autenticado
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setMessage({ type: 'danger', text: 'Error de conexión con el servidor' });
        navigate('/login'); // Redirigir al login en caso de error de conexión
      }
    };
    
    try {
      checkAuth();
    } catch (error) {
      console.error('Error en useEffect de autenticación:', error);
      setMessage({ type: 'danger', text: 'Error interno del sistema' });
    }
  }, [navigate]);

  // Función para simular progreso de carga - OPTIMIZACIÓN UX
  const simulateLoadingProgress = useCallback(() => {
    setLoadingProgress(0);
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // Mantener en 90% hasta que termine la carga real
        }
        return prev + Math.random() * 15; // Incremento variable más realista
      });
    }, 200);
    
    return progressInterval;
  }, []);

  const loadStudentsWithTardiness = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setInitialLoading(true);
      setLoadingProgress(0);
    } else {
      setLoading(true);
    }
    setMessage({ type: '', text: '' }); // Limpiar mensajes anteriores
    
    // Simular progreso para carga inicial
    const progressInterval = isInitialLoad ? simulateLoadingProgress() : null;
    
    try {
      let url = `${API_BASE_URL}/api/notifications/students-with-tardiness`;
      
      // Si hay filtro de fechas, usar el endpoint específico
      if (startDate && endDate && startDate.trim() && endDate.trim()) {
        url = `${API_BASE_URL}/api/notifications/students-with-tardiness-by-date?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        console.log('🔍 FILTRO DE FECHAS ACTIVO:');
        console.log('📅 Fecha inicio:', startDate);
        console.log('📅 Fecha fin:', endDate);
        console.log('🌐 URL del backend:', url);
      }
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Validar que la respuesta sea un array
        if (!Array.isArray(data)) {
          console.error('Respuesta del servidor no es un array:', data);
          setMessage({ type: 'danger', text: 'Formato de respuesta inválido del servidor' });
          return;
        }
        
        // Log para debugging - verificar consistencia
        console.log('=== DEBUGGING FRONTEND ===');
        console.log('📊 Total de estudiantes recibidos del backend:', data.length);
        
        if (startDate && endDate) {
          console.log('🔍 FILTRO DE FECHAS - RESULTADOS DEL BACKEND:');
          console.log('📅 Rango solicitado:', `${startDate} a ${endDate}`);
          console.log('👥 Estudiantes encontrados:', data.length);
          
          // Mostrar los primeros atrasos para verificar las fechas
          data.forEach(student => {
            if (student && student.rut && student.atrasos && student.atrasos.length > 0) {
              console.log(`📋 Estudiante ${student.rut} (${student.nombres}):`, 
                `${student.totalAtrasos} atrasos en el período`);
              console.log('📅 Fechas de atrasos:', 
                student.atrasos.map(a => a.fecha).slice(0, 3)); // Mostrar solo las primeras 3 fechas
            }
          });
        }
        
        data.forEach(student => {
          if (student && student.rut) {
            console.log(`Estudiante ${student.rut}: ${student.totalAtrasos || 0} atrasos, ${student.atrasos?.length || 0} en array atrasos`);
          }
        });
        
        setStudents(data);
        setSelectedStudents([]); // No seleccionar automáticamente
        
        // Las estadísticas se calcularán con useMemo para optimizar rendimiento
      } else {
        const errorText = await response.text();
        console.error('Error del servidor:', response.status, errorText);
        setMessage({ type: 'danger', text: `Error al cargar estudiantes: ${response.status}` });
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMessage({ type: 'danger', text: 'Error de conexión con el servidor' });
    } finally {
      // Limpiar intervalo de progreso si existe
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Completar progreso y cerrar loading
      if (isInitialLoad) {
        setLoadingProgress(100);
        // Pequeño delay para mostrar el 100%
        setTimeout(() => {
          setInitialLoading(false);
          setLoadingProgress(0);
        }, 500);
      } else {
        setLoading(false);
      }
    }
  };

  // Cargar estudiantes cuando cambie el filtro de mes - OPTIMIZADO
  useEffect(() => {
    // Solo recargar si ambas fechas están definidas y son válidas
    if (startDate && endDate && startDate.trim() && endDate.trim()) {
      // Verificar que las fechas sean diferentes a las anteriores para evitar recargas innecesarias
      const currentDateKey = `${startDate}-${endDate}`;
      const lastDateKey = localStorage.getItem('lastDateFilter');
      
      if (currentDateKey !== lastDateKey) {
        localStorage.setItem('lastDateFilter', currentDateKey);
        loadStudentsWithTardiness();
      }
    }
  }, [startDate, endDate]);

  // Función para aplicar filtros de fecha
  const applyFilters = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setMessage({ type: 'warning', text: 'La fecha de inicio no puede ser mayor que la fecha final' });
        return;
      }
      loadStudentsWithTardiness();
      setCurrentPage(1);
    } else {
      setMessage({ type: 'info', text: 'Selecciona ambas fechas para aplicar el filtro' });
    }
  };

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setMinTardinessFilter('');
    setPunctualityFilter('');
    setCurrentPage(1);
    loadStudentsWithTardiness();
  };

  const handleStudentSelection = useCallback((rut, checked) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, rut]);
    } else {
      setSelectedStudents(prev => prev.filter(s => s !== rut));
    }
  }, []);

  const handleSelectAll = (checked) => {
    if (checked) {
      // Seleccionar solo los estudiantes que están siendo mostrados (filtrados)
      setSelectedStudents(filteredStudents.map(s => s.rut));
    } else {
      // Desmarcar solo los estudiantes que están siendo mostrados (filtrados)
      const currentVisibleRuts = filteredStudents.map(s => s.rut);
      setSelectedStudents(selectedStudents.filter(rut => !currentVisibleRuts.includes(rut)));
    }
  };

  // Abrir modal de correo
  const handleOpenEmailModal = () => {
    if (selectedStudents.length === 0) {
      setMessage({ type: 'warning', text: 'Debe seleccionar al menos un estudiante' });
      return;
    }
    setShowEmailModal(true);
  };

  // Cerrar modal de correo
  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
  };

  // Cerrar modal de confirmación
  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false);
  };

  // Abrir modal de detalles de conceptos - OPTIMIZADA
  const handleShowDetails = useCallback((student) => {
    console.log('🔍 DEBUGGING - Datos del estudiante:', student);
    console.log('🔍 DEBUGGING - Atrasos del estudiante:', student.atrasos);
    if (student.atrasos) {
      student.atrasos.forEach((atraso, index) => {
        console.log(`🔍 DEBUGGING - Atraso ${index}:`, {
          concepto: atraso.concepto,
          trajoCertificado: atraso.trajoCertificado,
          certificadoAdjunto: atraso.certificadoAdjunto
        });
      });
    }
    setSelectedStudentDetails(student);
    setShowDetailsModal(true);
  }, []);

  // Abrir modal de análisis de puntualidad - OPTIMIZADA
  const handleShowPunctualityAnalysis = useCallback((student) => {
    setSelectedStudentPunctuality(student);
    setShowPunctualityModal(true);
  }, []);


  // Descargar certificado médico
  const handleDownloadCertificate = async (filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tardiness/certificado/${filename}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        // Crear un blob y descargar el archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setMessage({ type: 'danger', text: 'Error al descargar el certificado' });
      }
    } catch (error) {
      console.error('Error descargando certificado:', error);
      setMessage({ type: 'danger', text: 'Error de conexión al descargar certificado' });
    }
  };

  // Generar y descargar PDF de estudiantes seleccionados
  const handleDownloadPDF = async () => {
    if (selectedStudents.length === 0) {
      setMessage({ type: 'warning', text: 'Debe seleccionar al menos un estudiante para generar el PDF' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' }); // Limpiar mensajes anteriores
      
      const selectedStudentsData = students.filter(student => 
        student && selectedStudents.includes(student.rut)
      );
      
      if (selectedStudentsData.length === 0) {
        setMessage({ type: 'warning', text: 'No se encontraron datos válidos para los estudiantes seleccionados' });
        return;
      }
      
      // Generar PDF usando jsPDF
      await generatePDF(selectedStudentsData, 'estudiantes-seleccionados');
      
      setMessage({ type: 'success', text: 'PDF generado y descargado exitosamente' });
    } catch (error) {
      console.error('Error generando PDF:', error);
      const errorMessage = error.message || 'Error desconocido al generar el PDF';
      setMessage({ type: 'danger', text: `Error al generar el PDF: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  // Generar y descargar PDF de todos los estudiantes filtrados
  const handleDownloadPDFAll = async () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      setMessage({ type: 'warning', text: 'No hay estudiantes filtrados para generar el PDF' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' }); // Limpiar mensajes anteriores
      
      // Validar que los datos sean válidos
      const validStudents = filteredStudents.filter(student => 
        student && typeof student === 'object'
      );
      
      if (validStudents.length === 0) {
        setMessage({ type: 'warning', text: 'No se encontraron datos válidos para generar el PDF' });
        return;
      }
      
      // Generar PDF usando jsPDF
      await generatePDF(validStudents, 'reporte-filtros');
      
      setMessage({ type: 'success', text: 'PDF generado y descargado exitosamente' });
    } catch (error) {
      console.error('Error generando PDF:', error);
      const errorMessage = error.message || 'Error desconocido al generar el PDF';
      setMessage({ type: 'danger', text: `Error al generar el PDF: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  // Función para generar PDF institucional profesional
  const generatePDF = async (studentsData, filename) => {
    try {
      // Validar datos de entrada
      if (!studentsData || !Array.isArray(studentsData) || studentsData.length === 0) {
        throw new Error('No hay datos de estudiantes para generar el PDF');
      }

      // Importar jsPDF dinámicamente
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Configuración del PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 25; // Reducido para dar más espacio
      
      // Configurar fuente que soporte caracteres latinos
      pdf.setFont('helvetica');
      
      // ===== ENCABEZADO INSTITUCIONAL =====
      
      try {
        // Cargar y agregar el logo real del colegio - Pegado a la orilla izquierda
        const logoResponse = await fetch('/Logo.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(logoBlob);
          });
          
          // Agregar el logo pegado a la orilla izquierda
          pdf.addImage(logoBase64, 'PNG', margin, yPosition - 5, 25, 25);
        } else {
          // Fallback si no se puede cargar el logo
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, yPosition - 5, 25, 25, 'F');
          pdf.setTextColor(150, 150, 150);
          pdf.setFontSize(8);
          pdf.text('LOGO', margin + 12.5, yPosition + 7.5, { align: 'center' });
        }
      } catch (logoError) {
        console.warn('Error cargando logo:', logoError);
        // Fallback si hay error
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 5, 25, 25, 'F');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);
        pdf.text('LOGO', margin + 12.5, yPosition + 7.5, { align: 'center' });
      }
      
      // Información del colegio - Membrete compacto al lado del logo
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COLEGIO SAINT ARIELI', margin + 30, yPosition);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Dirección: Av. Colon Sur #725, San Bernardo', margin + 30, yPosition + 8);
      pdf.text('Teléfono: 228581016 | Email: contacto@colegiosaintarieli.cl', margin + 30, yPosition + 14);
      pdf.text('Sitio Web: www.colegiosaintarieli.cl', margin + 30, yPosition + 20);
      
      yPosition += 35;
      
      // Título del informe - Más limpio y grande
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102); // Azul institucional
      pdf.text('INFORME DE ATRASOS', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Fecha de emisión - Más limpia
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 18;
      
      // ===== DATOS DEL ESTUDIANTE =====
      
      if (studentsData.length === 1) {
        const student = studentsData[0];
        
        // Recuadro para datos del estudiante - Más compacto
        pdf.setDrawColor(0, 51, 102);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 30);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DATOS DEL ESTUDIANTE:', margin + 5, yPosition);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        const nombreCompleto = `${student.nombres || ''} ${student.apellidosPaterno || ''} ${student.apellidosMaterno || ''}`.trim();
        pdf.text(`Nombre completo: ${nombreCompleto}`, margin + 5, yPosition + 10);
        pdf.text(`RUT: ${student.rut || 'N/A'}`, margin + 5, yPosition + 17);
        pdf.text(`Curso: ${student.curso || 'N/A'}`, margin + 120, yPosition + 10);
        pdf.text(`Año escolar: 2025`, margin + 120, yPosition + 17);
        
        yPosition += 35;
      }
      
      // ===== PÁRRAFO EXPLICATIVO =====
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      const parrafoExplicativo = `El presente informe detalla los registros de atrasos del estudiante durante el año escolar 2025, con el objetivo de mantener informados a los apoderados sobre la puntualidad del estudiante y establecer las medidas necesarias para mejorar la asistencia oportuna a clases.`;
      
      // Dividir el párrafo en líneas que quepan en el ancho de la página
      const maxWidth = pageWidth - (margin * 2);
      const lines = pdf.splitTextToSize(parrafoExplicativo, maxWidth);
      
      lines.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      yPosition += 12;
      
      // ===== TABLA DE ATRASOS =====
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      pdf.text('REGISTRO DE ATRASOS:', margin, yPosition);
      yPosition += 8;
      
      // Encabezados de la tabla - Mejor distribución del espacio
      const headers = ['N°', 'Estudiante', 'Fecha', 'Hora llegada', 'Hora inicio', 'Minutos atraso', 'Observaciones'];
      const columnWidths = [12, 40, 22, 22, 22, 25, 45];
      let xPosition = margin;
      
      // Fondo para encabezados
      pdf.setFillColor(0, 51, 102);
      pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 8, 'F');
      
      // Texto de encabezados en blanco
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      headers.forEach((header, index) => {
        pdf.text(header, xPosition + 1, yPosition);
        xPosition += columnWidths[index];
      });
      
      yPosition += 6;
      
      // Datos de la tabla
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8); // Fuente más pequeña para los datos
      
      // Buscar atrasos en todos los estudiantes
      let todosLosAtrasos = [];
      
      // Debug: mostrar qué datos están llegando
      console.log('Datos de estudiantes recibidos:', studentsData);
      
      studentsData.forEach(student => {
        console.log('Procesando estudiante:', student);
        if (student.atrasos && Array.isArray(student.atrasos)) {
          console.log('Atrasos encontrados:', student.atrasos);
          student.atrasos.forEach(atraso => {
            todosLosAtrasos.push({
              ...atraso,
              nombreEstudiante: `${student.nombres || ''} ${student.apellidosPaterno || ''} ${student.apellidosMaterno || ''}`.trim(),
              curso: student.curso
            });
          });
        } else {
          console.log('No se encontraron atrasos para:', student.nombres);
        }
      });
      
      console.log('Total de atrasos encontrados:', todosLosAtrasos.length);
      
      if (todosLosAtrasos.length > 0) {
        // Ordenar atrasos por fecha (más reciente primero)
        todosLosAtrasos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        todosLosAtrasos.forEach((atraso, index) => {
          // Verificar si hay espacio suficiente en la página
          if (yPosition > 200) {
            pdf.addPage();
            yPosition = 30;
          }
          
          // Fondo alternado para filas
          if (index % 2 === 0) {
            pdf.setFillColor(248, 249, 250);
            pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 6, 'F');
          }
          
          xPosition = margin;
          
          // Número
          pdf.text((index + 1).toString(), xPosition + 3, yPosition);
          xPosition += columnWidths[0];
          
          // Estudiante
          const nombreEstudiante = atraso.nombreEstudiante || 'N/A';
          const nombreLines = pdf.splitTextToSize(nombreEstudiante, columnWidths[1] - 2);
          pdf.text(nombreLines[0], xPosition + 1, yPosition);
          xPosition += columnWidths[1];
          
          // Fecha
          try {
            const fecha = new Date(atraso.fecha).toLocaleDateString('es-CL');
            pdf.text(fecha, xPosition + 1, yPosition);
          } catch (error) {
            pdf.text('N/A', xPosition + 1, yPosition);
          }
          xPosition += columnWidths[2];
          
          // Hora llegada
          pdf.text(atraso.hora || 'N/A', xPosition + 1, yPosition);
          xPosition += columnWidths[3];
          
          // Hora inicio clases (estimada)
          pdf.text('08:00', xPosition + 1, yPosition);
          xPosition += columnWidths[4];
          
          // Minutos de atraso (estimado)
          try {
            const horaLLegada = atraso.hora;
            if (horaLLegada) {
              const [horas, minutos] = horaLLegada.split(':');
              const minutosLlegada = parseInt(horas) * 60 + parseInt(minutos);
              const minutosInicio = 8 * 60; // 8:00 AM
              const atrasoMinutos = Math.max(0, minutosLlegada - minutosInicio);
              pdf.text(atrasoMinutos.toString(), xPosition + 3, yPosition);
            } else {
              pdf.text('N/A', xPosition + 3, yPosition);
            }
          } catch (error) {
            pdf.text('N/A', xPosition + 3, yPosition);
          }
          xPosition += columnWidths[5];
          
          // Observaciones
          const observacion = atraso.motivo || 'Sin observaciones';
          const observacionLines = pdf.splitTextToSize(observacion, columnWidths[6] - 2);
          pdf.text(observacionLines[0], xPosition + 1, yPosition);
          
          yPosition += 6;
        });
      } else {
        // Si no hay atrasos, mostrar mensaje
        pdf.text('No hay registros de atrasos disponibles para los estudiantes seleccionados.', margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 12;
      
      // Sección del resumen del período eliminada para optimizar espacio
      
      // ===== OBSERVACIONES GENERALES =====
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBSERVACIONES GENERALES:', margin, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const observacionesGenerales = `Se recomienda establecer horarios regulares de sueño y establecer rutinas matutinas que permitan al estudiante llegar puntualmente a clases. La puntualidad es fundamental para el desarrollo de hábitos de responsabilidad y respeto hacia la comunidad educativa.`;
      
      const observacionesLines = pdf.splitTextToSize(observacionesGenerales, maxWidth);
      observacionesLines.forEach(line => {
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      yPosition += 15;
      
      // ===== FIRMAS Y VALIDACIÓN =====
      
      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 12;
      
      // Espacio para firmas - Más compacto
      const firmaWidth = 70;
      const firmaSpacing = (pageWidth - (margin * 2) - (firmaWidth * 2)) / 3;
      
      // Firma del profesor/inspector
      pdf.setDrawColor(0, 51, 102);
      pdf.line(margin + firmaSpacing, yPosition, margin + firmaSpacing + firmaWidth, yPosition);
      pdf.setTextColor(0, 51, 102);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Profesor Jefe / Inspector', margin + firmaSpacing + (firmaWidth / 2), yPosition + 4, { align: 'center' });
      
      // Firma del apoderado
      pdf.line(margin + firmaSpacing * 2 + firmaWidth, yPosition, margin + firmaSpacing * 2 + firmaWidth * 2, yPosition);
      pdf.text('Apoderado', margin + firmaSpacing * 2 + firmaWidth + (firmaWidth / 2), yPosition + 4, { align: 'center' });
      
      yPosition += 15;
      
      // Zonas de QR y SELLO eliminadas para un diseño más limpio
      
      // Pie de página
      try {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
          pdf.text(`Documento generado el: ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
        }
      } catch (error) {
        console.warn('Error generando pie de página:', error);
      }
      
      // Descargar el PDF
      try {
        const timestamp = new Date().toISOString().split('T')[0];
        const safeFilename = filename.replace(/[^a-zA-Z0-9-_]/g, '_');
        pdf.save(`Informe-SaintArieli-${safeFilename}-${timestamp}.pdf`);
      } catch (error) {
        console.warn('Error guardando PDF:', error);
        pdf.save('Informe-SaintArieli-Atrasos.pdf');
      }
      
    } catch (error) {
      console.error('Error en generatePDF:', error);
      throw new Error('Error al generar el PDF: ' + error.message);
    }
  };

  // Función para calcular la calificación mensual de un estudiante - OPTIMIZADA
  const calculateMonthlyGrade = useCallback((atrasos) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Días hábiles por mes (aproximado)
      const workingDaysByMonth = [20, 20, 20, 21, 19, 12, 18, 20, 17, 21, 20, 9];
      const workingDays = workingDaysByMonth[currentMonth - 1] || 20;
      
      // Filtrar atrasos del mes actual
      const monthlyTardiness = atrasos.filter(atraso => {
        const atrasoDate = new Date(atraso.fecha);
        return atrasoDate.getMonth() + 1 === currentMonth && 
               atrasoDate.getFullYear() === currentYear;
      });
      
      // Calcular porcentaje de puntualidad
      const tardinessCount = monthlyTardiness.length;
      const punctualDays = Math.max(0, workingDays - tardinessCount);
      const percentage = workingDays > 0 ? Math.round((punctualDays / workingDays) * 100) : 100;
      
      // Determinar calificación
      let grade, color;
      if (percentage >= 90) {
        grade = 'Excelente';
        color = 'success';
      } else if (percentage >= 75) {
        grade = 'Bueno';
        color = 'warning';
      } else if (percentage >= 60) {
        grade = 'Regular';
        color = 'info';
      } else {
        grade = 'Necesita mejora';
        color = 'danger';
      }
      
      return {
        percentage,
        grade,
        color,
        workingDays,
        tardiness: tardinessCount,
        punctualDays
      };
    } catch (error) {
      console.error('Error calculando calificación mensual:', error);
      return {
        percentage: 100,
        grade: 'Excelente',
        color: 'success',
        workingDays: 0,
        tardiness: 0,
        punctualDays: 0
      };
    }
  }, []);

  // Generar y descargar Excel de estudiantes seleccionados
  const handleDownloadExcel = async () => {
    try {
      if (selectedStudents.length === 0) {
        setMessage({ type: 'warning', text: 'Debe seleccionar al menos un estudiante para generar el Excel' });
        return;
      }

      const selectedStudentsData = students.filter(student => 
        student && selectedStudents.includes(student.rut)
      );

      console.log('🔍 Debug Excel - Estudiantes seleccionados:', selectedStudents);
      console.log('🔍 Debug Excel - Total estudiantes:', students.length);
      console.log('🔍 Debug Excel - Estudiantes filtrados:', selectedStudentsData.length);
      console.log('🔍 Debug Excel - Primer estudiante:', selectedStudentsData[0]);

      if (selectedStudentsData.length === 0) {
        setMessage({ type: 'warning', text: 'No se encontraron datos válidos para generar el Excel' });
        return;
      }

      // Generar Excel usando XLSX
      await generateExcel(selectedStudentsData, 'estudiantes-seleccionados');
      setMessage({ type: 'success', text: 'Excel generado y descargado exitosamente' });
    } catch (error) {
      console.error('Error generando Excel:', error);
      const errorMessage = error.message || 'Error desconocido al generar el Excel';
      setMessage({ type: 'danger', text: `Error al generar el Excel: ${errorMessage}` });
    }
  };

  // Generar y descargar Excel de todos los estudiantes filtrados
  const handleDownloadExcelAll = async () => {
    try {
      if (filteredStudents.length === 0) {
        setMessage({ type: 'warning', text: 'No hay estudiantes filtrados para generar el Excel' });
        return;
      }

      // Filtrar estudiantes válidos
      const validStudents = filteredStudents.filter(student => 
        student && student.rut && student.nombreCompleto
      );

      if (validStudents.length === 0) {
        setMessage({ type: 'warning', text: 'No se encontraron datos válidos para generar el Excel' });
        return;
      }

      // Generar Excel usando XLSX
      await generateExcel(validStudents, 'reporte-filtros');
      setMessage({ type: 'success', text: 'Excel generado y descargado exitosamente' });
    } catch (error) {
      console.error('Error generando Excel:', error);
      const errorMessage = error.message || 'Error desconocido al generar el Excel';
      setMessage({ type: 'danger', text: `Error al generar el Excel: ${errorMessage}` });
    }
  };

  // Función para generar Excel institucional profesional
  const generateExcel = async (studentsData, filename) => {
    try {
      console.log('🔍 Debug generateExcel - Datos recibidos:', studentsData);
      console.log('🔍 Debug generateExcel - Tipo:', typeof studentsData);
      console.log('🔍 Debug generateExcel - Es array:', Array.isArray(studentsData));
      console.log('🔍 Debug generateExcel - Longitud:', studentsData?.length);
      
      if (studentsData && studentsData.length > 0) {
        console.log('🔍 Debug generateExcel - Primer estudiante completo:', studentsData[0]);
        console.log('🔍 Debug generateExcel - Campos disponibles:', Object.keys(studentsData[0]));
      }
      
      // Validar datos de entrada
      if (!studentsData || !Array.isArray(studentsData) || studentsData.length === 0) {
        console.error('❌ Error: Datos inválidos para Excel');
        throw new Error('No hay datos de estudiantes para generar el Excel');
      }

      // Crear datos para el Excel
      const excelData = studentsData.map((student, index) => {
        // Construir nombre completo desde los campos individuales
        const nombreCompleto = student.nombres && student.apellidosPaterno && student.apellidosMaterno 
          ? `${student.nombres} ${student.apellidosPaterno} ${student.apellidosMaterno}`
          : student.nombreCompleto || student.nombres || 'N/A';
        
        const rut = student.rut || 'N/A';
        const curso = student.curso || 'N/A';
        const totalAtrasos = student.atrasos ? student.atrasos.length : (student.totalAtrasos || 0);
        
        // Obtener el último atraso
        let ultimoAtraso = 'N/A';
        let horaUltimoAtraso = 'N/A';
        let tieneCertificado = 'N/A';
        if (student.atrasos && student.atrasos.length > 0) {
          const ultimoAtrasoObj = student.atrasos[student.atrasos.length - 1];
          ultimoAtraso = ultimoAtrasoObj.fecha ? 
            new Date(ultimoAtrasoObj.fecha).toLocaleDateString('es-CL') : 'N/A';
          horaUltimoAtraso = ultimoAtrasoObj.hora || 'N/A';
          tieneCertificado = ultimoAtrasoObj.trajoCertificado ? 'Sí' : 'No';
        }
        
        return {
          'N°': index + 1,
          'RUT': rut,
          'Nombre Completo': nombreCompleto,
          'Curso': curso,
          'Total Atrasos': totalAtrasos,
          'Último Atraso': ultimoAtraso,
          'Hora Llegada': horaUltimoAtraso,
          'Tiene Certificado': tieneCertificado
        };
      });

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Configurar anchos de columna
      const colWidths = [
        { wch: 5 },   // N°
        { wch: 15 },  // RUT
        { wch: 35 },  // Nombre Completo
        { wch: 10 },  // Curso
        { wch: 12 },  // Total Atrasos
        { wch: 15 },  // Último Atraso
        { wch: 12 },  // Hora Llegada
        { wch: 15 }   // Tiene Certificado
      ];
      ws['!cols'] = colWidths;

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes con Atrasos');

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const safeFilename = filename.replace(/[^a-zA-Z0-9]/g, '-');
      
      // Descargar el archivo
      try {
        XLSX.writeFile(wb, `Informe-SaintArieli-${safeFilename}-${timestamp}.xlsx`);
      } catch (error) {
        console.warn('Error guardando Excel:', error);
        XLSX.writeFile(wb, 'Informe-SaintArieli-Atrasos.xlsx');
      }
      
    } catch (error) {
      console.error('Error en generateExcel:', error);
      throw new Error('Error al generar el Excel: ' + error.message);
    }
  };

  const handleSendEmails = async () => {
    if (selectedStudents.length === 0) {
      setMessage({ type: 'warning', text: 'Debe seleccionar al menos un estudiante' });
      return;
    }

    if (!emailForm.asunto.trim() || !emailForm.contenido.trim()) {
      setMessage({ type: 'warning', text: 'Debe completar el asunto y contenido del correo' });
      return;
    }

    // Cerrar modal de composición y abrir modal de confirmación
    setShowEmailModal(false);
    setShowConfirmationModal(true);
  };

  // Función que realmente envía los correos después de la confirmación
  const confirmAndSendEmails = async () => {
    setSending(true);
    setMessage({ type: '', text: '' });
    setShowConfirmationModal(false);

    // Log para debugging - verificar datos antes del envío
    console.log('=== DEBUGGING ENVÍO DE CORREOS ===');
    const selectedStudentsData = students.filter(student => selectedStudents.includes(student.rut));
    selectedStudentsData.forEach(student => {
      console.log(`Estudiante ${student.rut}: ${student.totalAtrasos} atrasos en frontend`);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          asunto: emailForm.asunto,
          contenido: emailForm.contenido,
          estudiantesSeleccionados: selectedStudents
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Correos enviados exitosamente. ${data.enviados} enviados, ${data.fallidos} fallidos.` 
        });
        
        // Limpiar formulario
        setEmailForm({
          asunto: 'Notificación de Atrasos - Estudiante',
          contenido: `Estimado apoderado,

Le informamos que su pupilo(a) {NOMBRE_ESTUDIANTE} del curso {CURSO} ha acumulado {TOTAL_ATRASOS} atraso(s) durante el período escolar.

Detalle de atrasos:
{DETALLE_ATRASOS}

Es importante que tome las medidas necesarias para evitar futuros atrasos, ya que esto puede afectar el rendimiento académico del estudiante.

Atentamente,
Equipo Directivo`
        });
        
        // Limpiar selecciones
        setSelectedStudents([]);
        
        // Recargar estudiantes
        setTimeout(() => {
          loadStudentsWithTardiness();
        }, 2000);
      } else {
        setMessage({ type: 'danger', text: data.message || 'Error al enviar correos' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error de conexión al enviar correos' });
    } finally {
      setSending(false);
    }
  };

  const getTardinessColor = useCallback((count) => {
    if (count >= 5) return 'danger';
    if (count >= 3) return 'warning';
    return 'info';
  }, []);

  // Función para obtener el color del badge según el concepto - OPTIMIZADA
  const getConceptoColor = useCallback((concepto) => {
    switch (concepto) {
      case 'presente':
        return 'success'; // Verde - cuenta como presente
      case 'atrasado-presente':
        return 'warning'; // Amarillo - cuenta como presente
      case 'ausente':
        return 'danger'; // Rojo - NO cuenta como presente
      default:
        return 'secondary';
    }
  }, []);

  // Función para obtener la etiqueta del concepto - OPTIMIZADA
  const getConceptoLabel = useCallback((concepto) => {
    switch (concepto) {
      case 'presente':
        return 'Presente';
      case 'atrasado-presente':
        return 'Atrasado-Presente';
      case 'ausente':
        return 'Ausente';
      default:
        return concepto || 'Sin clasificar';
    }
  }, []);

  // Función para calcular el porcentaje de puntualidad mensual - OPTIMIZADA
  const calculateMonthlyPunctuality = useCallback((student, month, year) => {
    try {
      // Días hábiles por mes - Cacheado para mejor rendimiento
      const workingDaysByMonth = {
        1: 20, 2: 20, 3: 20, 4: 21, 5: 19, 6: 12,
        7: 18, 8: 20, 9: 17, 10: 21, 11: 20, 12: 9
      };
      
      // Obtener atrasos del mes específico
      if (!student.atrasos || !Array.isArray(student.atrasos)) {
        return { percentage: 100, grade: 'Excelente', color: 'success', workingDays: workingDaysByMonth[month] || 0, tardiness: 0, punctualDays: workingDaysByMonth[month] || 0 };
      }
      
      const monthTardiness = student.atrasos.filter(atraso => {
        try {
          const atrasoDate = new Date(atraso.fecha);
          return atrasoDate.getMonth() + 1 === month && atrasoDate.getFullYear() === year;
        } catch (error) {
          return false;
        }
      });
      
      const workingDays = workingDaysByMonth[month] || 0;
      const tardinessCount = monthTardiness.length;
      const punctualDays = Math.max(0, workingDays - tardinessCount);
      const percentage = workingDays > 0 ? Math.round((punctualDays / workingDays) * 100) : 100;
      
      // Determinar calificación
      let grade, color;
      if (percentage >= 90) {
        grade = 'Excelente';
        color = 'success';
      } else if (percentage >= 75) {
        grade = 'Bueno';
        color = 'warning';
      } else if (percentage >= 60) {
        grade = 'Regular';
        color = 'info';
      } else {
        grade = 'Necesita mejora';
        color = 'danger';
      }
      
      return {
        percentage,
        grade,
        color,
        workingDays,
        tardiness: tardinessCount,
        punctualDays
      };
    } catch (error) {
      console.warn('Error calculando puntualidad mensual:', error);
      return { percentage: 100, grade: 'Excelente', color: 'success', workingDays: 0, tardiness: 0, punctualDays: 0 };
    }
  }, []);

  // Función para obtener el mes actual - OPTIMIZADA
  const getCurrentMonth = useCallback(() => {
    return new Date().getMonth() + 1;
  }, []);

  // Función para obtener el año actual - OPTIMIZADA
  const getCurrentYear = useCallback(() => {
    return new Date().getFullYear();
  }, []);

  // Filtrar estudiantes por término de búsqueda y cantidad mínima de atrasos - OPTIMIZADO
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    try {
      return students.filter(student => {
        // Validar que el estudiante tenga las propiedades necesarias
        if (!student || typeof student !== 'object') return false;
        
        // Filtro de búsqueda - OPTIMIZADO con debounce
        let searchMatch = true;
        if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
          const searchLower = debouncedSearchTerm.toLowerCase().trim();
          searchMatch = (
            (student.rut && student.rut.toString().toLowerCase().includes(searchLower)) ||
            (student.nombres && student.nombres.toLowerCase().includes(searchLower)) ||
            (student.apellidosPaterno && student.apellidosPaterno.toLowerCase().includes(searchLower)) ||
            (student.apellidosMaterno && student.apellidosMaterno.toLowerCase().includes(searchLower)) ||
            (student.curso && student.curso.toLowerCase().includes(searchLower)) ||
            (student.correoApoderado && student.correoApoderado.toLowerCase().includes(searchLower))
          );
        }
        
        // Si no coincide la búsqueda, retornar false inmediatamente
        if (!searchMatch) return false;
        
        // Filtro por cantidad mínima de atrasos
        let tardinessMatch = true;
        if (minTardinessFilter && minTardinessFilter.trim()) {
          const minTardiness = parseInt(minTardinessFilter);
          if (!isNaN(minTardiness)) {
            tardinessMatch = student.totalAtrasos >= minTardiness;
          }
        }
        
        // Si no coincide el filtro de atrasos, retornar false inmediatamente
        if (!tardinessMatch) return false;

        // Filtro por calificación de puntualidad mensual
        let punctualityMatch = true;
        if (punctualityFilter && punctualityFilter.trim()) {
          const currentMonth = getCurrentMonth();
          const currentYear = getCurrentYear();
          const punctuality = calculateMonthlyPunctuality(student, currentMonth, currentYear);
          
          switch (punctualityFilter) {
            case 'excelente':
              punctualityMatch = punctuality.percentage >= 90;
              break;
            case 'bueno':
              punctualityMatch = punctuality.percentage >= 75 && punctuality.percentage < 90;
              break;
            case 'regular':
              punctualityMatch = punctuality.percentage >= 60 && punctuality.percentage < 75;
              break;
            case 'necesita-mejora':
              punctualityMatch = punctuality.percentage < 60;
              break;
            default:
              punctualityMatch = true;
          }
        }
        
        // Si no coincide el filtro de puntualidad, retornar false inmediatamente
        if (!punctualityMatch) return false;
        
        // Filtro por fechas: SOLO aplicar cuando NO se está usando el endpoint de fechas
        // Si startDate y endDate están definidos, significa que el backend ya filtró por fechas
        // Por lo tanto, no necesitamos filtrar nuevamente en el frontend
        let dateMatch = true;
        
        // Solo aplicar filtro de fechas en el frontend si NO estamos usando el endpoint de fechas
        // (es decir, cuando estamos mostrando datos históricos completos)
        if (!startDate || !endDate) {
          // No hay filtro de fechas activo, mostrar todos los estudiantes
          dateMatch = true;
        } else {
          // Hay filtro de fechas activo, el backend ya filtró los datos
          // No necesitamos filtrar nuevamente en el frontend
          dateMatch = true;
        }
        
        return dateMatch;
      });
    } catch (error) {
      console.error('Error en filtrado de estudiantes:', error);
      return students; // En caso de error, retornar todos los estudiantes
    }
  }, [students, debouncedSearchTerm, startDate, endDate, minTardinessFilter]);

  // Calcular estadísticas - OPTIMIZADO con useMemo
  const stats = useMemo(() => {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        totalTardiness: 0,
        criticalCases: 0
      };
    }

    try {
      const totalTardiness = students.reduce((sum, s) => sum + (s.totalAtrasos || 0), 0);
      const criticalCases = students.filter(s => (s.totalAtrasos || 0) >= 5).length;
      
      return {
        totalStudents: students.length,
        totalTardiness,
        criticalCases
      };
    } catch (statsError) {
      console.warn('Error calculando estadísticas:', statsError);
      return {
        totalStudents: students.length,
        totalTardiness: 0,
        criticalCases: 0
      };
    }
  }, [students]);

  // Calcular paginación - OPTIMIZADO con useMemo
  const paginationData = useMemo(() => {
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    
    return {
      indexOfLastStudent,
      indexOfFirstStudent,
      currentStudents,
      totalPages
    };
  }, [currentPage, studentsPerPage, filteredStudents]);

  const { indexOfLastStudent, indexOfFirstStudent, currentStudents, totalPages } = paginationData;

  // Cambiar página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Resetear a primera página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, minTardinessFilter, punctualityFilter]);

  // Efecto para manejar la visibilidad del sidebar cuando hay modales abiertos
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-navbar');
    console.log('🔍 Sidebar encontrado:', sidebar);
    console.log('📧 showEmailModal:', showEmailModal);
    console.log('✅ showConfirmationModal:', showConfirmationModal);
    
    if (sidebar) {
      if (showEmailModal || showConfirmationModal) {
        console.log('🚀 Agregando clase modal-open al sidebar');
        sidebar.classList.add('modal-open');
        // También aplicar estilos inline como respaldo
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.opacity = '0';
        sidebar.style.visibility = 'hidden';
        sidebar.style.pointerEvents = 'none';
        sidebar.style.left = '-100%';
        sidebar.style.position = 'absolute';
        sidebar.style.zIndex = '-1';
        console.log('📋 Clases del sidebar:', sidebar.classList.toString());
      } else {
        console.log('🔄 Removiendo clase modal-open del sidebar');
        sidebar.classList.remove('modal-open');
        // Remover estilos inline
        sidebar.style.transform = '';
        sidebar.style.opacity = '';
        sidebar.style.visibility = '';
        sidebar.style.pointerEvents = '';
        sidebar.style.left = '';
        sidebar.style.position = '';
        sidebar.style.zIndex = '';
        console.log('📋 Clases del sidebar:', sidebar.classList.toString());
      }
    } else {
      console.log('❌ No se encontró el sidebar con clase .sidebar-navbar');
    }
  }, [showEmailModal, showConfirmationModal]);

  // Mostrar loading fullscreen durante carga inicial
  if (initialLoading) {
    return <FullscreenLoading progress={loadingProgress} />;
  }

  return (
    <Container fluid className="py-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/dashboard" }}>Inicio</Breadcrumb.Item>
        <Breadcrumb.Item active>Notificaciones</Breadcrumb.Item>
      </Breadcrumb>

      {/* Título de la página */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="d-flex align-items-center gap-3 mb-3">
                <FaEnvelope className="text-primary" size={32} />
                Notificaciones por Correo a Apoderados
              </h1>
              <p className="text-muted mb-0">Gestiona y envía notificaciones automáticas sobre atrasos estudiantiles</p>
              

            </div>
            
            
          </div>
        </Col>
      </Row>

      {/* Estadísticas resumidas */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100 border-primary">
            <Card.Body className="py-3">
              <FaUsers className="text-primary mb-2" size={28} />
              <h2 className="text-primary mb-1">{stats.totalStudents}</h2>
              <p className="text-muted mb-0 fw-bold">Estudiantes con Atrasos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 border-warning">
            <Card.Body className="py-3">
              <FaChartBar className="text-warning mb-2" size={28} />
              <h2 className="text-warning mb-1">{stats.totalTardiness}</h2>
              <p className="text-muted mb-0 fw-bold">Total de Atrasos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 border-danger">
            <Card.Body className="py-3">
              <FaEnvelope className="text-danger mb-2" size={28} />
              <h2 className="text-danger mb-1">{stats.criticalCases}</h2>
              <p className="text-muted mb-0 fw-bold">Casos Críticos (≥5)</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Mensajes de alerta */}
      {message.text && (
        <Row className="mb-4">
          <Col>
            <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          </Col>
        </Row>
      )}


      {/* Lista de estudiantes */}
      <Row>
        <Col>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <FaUsers className="me-2" />
                  {startDate && endDate ? (
                    `Estudiantes con Atrasos entre ${new Date(startDate).toLocaleDateString('es-CL')} y ${new Date(endDate).toLocaleDateString('es-CL')}`
                  ) : (
                    'Estudiantes con Atrasos (Histórico completo)'
                  )}
                </h5>
                {selectedStudents.length > 0 && (
                  <div className="mt-1">
                    <Badge bg="warning" className="fs-6">
                      ✓ {selectedStudents.length} seleccionado{selectedStudents.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 align-items-center">
                <Badge bg="primary" className="fs-6">
                  🎯 {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
                </Badge>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => loadStudentsWithTardiness(false)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Cargando...</span>
                              </div>
                              Actualizando...
                            </>
                          ) : (
                            <>
                              <FaHistory className="me-2" />
                              Actualizar
                            </>
                          )}
                        </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Filtros consolidados - Versión compacta */}
              <Row className="mb-3">
                <Col>
                  <div className="p-2 bg-light rounded border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0 text-primary">
                        🎛️ FILTROS Y BÚSQUEDA
                      </h6>
                      {/* Botones de acción integrados en el header */}
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setStartDate(today);
                            setEndDate(today);
                          }}
                          className="shadow-sm"
                        >
                          📅 Hoy
                        </Button>
                        {filteredStudents.length > 0 && (
                          <>
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => handleDownloadPDFAll()}
                              className="shadow-sm btn-pdf me-2"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Generando...</span>
                                  </div>
                                  Generando PDF...
                                </>
                              ) : (
                                <>
                                  📄 PDF ({filteredStudents.length})
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => handleDownloadExcelAll()}
                              className="shadow-sm btn-excel"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Generando...</span>
                                  </div>
                                  Generando Excel...
                                </>
                              ) : (
                                <>
                                  <FaFileExcel className="me-1" />
                                  Excel ({filteredStudents.length})
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        
                        {(searchTerm || startDate || endDate || minTardinessFilter) && (
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={clearAllFilters}
                            className="shadow-sm"
                          >
                            🗑️ Limpiar
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Filtros en una sola fila compacta */}
                    <Row className="g-2 align-items-end">
                      <Col md={3}>
                        <InputGroup size="sm">
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Buscar por RUT, nombre, curso o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setSearchTerm('')}
                            >
                              ×
                            </Button>
                          )}
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <InputGroup size="sm">
                          <InputGroup.Text>
                            <FaFilter />
                          </InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="1"
                            placeholder="Mín. atrasos"
                            value={minTardinessFilter}
                            onChange={(e) => setMinTardinessFilter(e.target.value)}
                          />
                          {minTardinessFilter && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setMinTardinessFilter('')}
                            >
                              ×
                            </Button>
                            )}
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <InputGroup size="sm">
                          <InputGroup.Text>
                            📊
                          </InputGroup.Text>
                          <Form.Select
                            size="sm"
                            value={punctualityFilter}
                            onChange={(e) => setPunctualityFilter(e.target.value)}
                          >
                            <option value="">Todas las calificaciones</option>
                            <option value="excelente">🟢 Excelente (90-100%)</option>
                            <option value="bueno">🟡 Bueno (75-89%)</option>
                            <option value="regular">🟠 Regular (60-74%)</option>
                            <option value="necesita-mejora">🔴 Necesita mejora (0-59%)</option>
                          </Form.Select>
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <InputGroup size="sm">
                          <InputGroup.Text>
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={startDate || ''}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Desde"
                            max="2025-12-31"
                          />
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <InputGroup size="sm">
                          <InputGroup.Text>
                            <FaCalendarAlt />
                          </InputGroup.Text>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={endDate || ''}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="Hasta"
                            max="2025-12-31"
                          />
                        </InputGroup>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                  <h5 className="text-primary mb-2">Actualizando datos...</h5>
                  <p className="text-muted mb-0">Obteniendo información de estudiantes</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover size="lg" className="table-wide">
                    <thead>
                      <tr>
                        <th>
                          <div className="d-flex align-items-center">
                            <Form.Check
                              type="checkbox"
                              checked={
                                filteredStudents.length > 0 && 
                                filteredStudents.every(student => selectedStudents.includes(student.rut))
                              }
                              ref={(input) => {
                                if (input) {
                                  input.indeterminate = 
                                    filteredStudents.length > 0 && 
                                    selectedStudents.some(rut => 
                                      filteredStudents.some(student => student.rut === rut)
                                    ) &&
                                    !filteredStudents.every(student => selectedStudents.includes(student.rut));
                                }
                              }}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                            <small className="text-muted ms-1" title="Selecciona solo los estudiantes visibles">
                              (filtrados)
                            </small>
                          </div>
                        </th>
                        <th>RUT</th>
                        <th>Nombre Completo</th>
                        <th>Curso</th>
                        <th>Email Apoderado</th>
                        <th>
                          {startDate && endDate ? 'Atrasos del Período' : 
                            minTardinessFilter ? `Atrasos (≥${minTardinessFilter})` : 
                            'Total Atrasos'}
                        </th>
                        <th>Último Atraso</th>
                        <th>Concepto Último Atraso</th>
                        <th>Calificación Mensual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStudents.map((student) => (
                        <StudentRow 
                          key={student.rut}
                          student={student}
                          isSelected={selectedStudents.includes(student.rut)}
                          onSelect={handleStudentSelection}
                          getTardinessColor={getTardinessColor}
                          getConceptoColor={getConceptoColor}
                          getConceptoLabel={getConceptoLabel}
                          calculateMonthlyPunctuality={calculateMonthlyPunctuality}
                          getCurrentMonth={getCurrentMonth}
                          getCurrentYear={getCurrentYear}
                          handleShowDetails={handleShowDetails}
                          handleShowPunctualityAnalysis={handleShowPunctualityAnalysis}
                        />
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              

              
              {filteredStudents.length === 0 && !loading && (
                <Alert variant="info" className="text-center">
                  <h5 className="mb-3">📊 Resumen de Filtros Aplicados</h5>
                  <div className="mb-3">
                    {startDate && endDate ? (
                      <p className="mb-2">
                        <strong>Período seleccionado:</strong> {new Date(startDate).toLocaleDateString('es-CL')} - {new Date(endDate).toLocaleDateString('es-CL')}
                      </p>
                    ) : (
                      <p className="mb-2">
                        <strong>Período:</strong> Histórico completo
                      </p>
                    )}
                    {searchTerm && (
                      <p className="mb-2">
                        <strong>Búsqueda:</strong> "{searchTerm}"
                      </p>
                    )}
                    {minTardinessFilter && (
                      <p className="mb-2">
                        <strong>Filtro mínimo:</strong> {minTardinessFilter}+ atrasos
                      </p>
                    )}
                  </div>
                  
                  <div className="alert alert-warning">
                    <strong>Resultado:</strong> No se encontraron estudiantes que coincidan con los filtros aplicados.
                  </div>
                  
                  
                </Alert>
              )}
              
              {/* Paginación */}
              {filteredStudents.length > 0 && totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                    />
                    
                    {/* Mostrar páginas numeradas */}
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      // Mostrar solo algunas páginas para no saturar
                      if (
                        pageNumber === 1 || 
                        pageNumber === totalPages || 
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <Pagination.Item
                            key={pageNumber}
                            active={pageNumber === currentPage}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Pagination.Item>
                        );
                      } else if (
                        pageNumber === currentPage - 2 || 
                        pageNumber === currentPage + 2
                      ) {
                        return <Pagination.Ellipsis key={pageNumber} />;
                      }
                      return null;
                    })}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(totalPages)} 
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
              
              {/* Información de paginación */}
              {filteredStudents.length > 0 && (
                <div className="text-center mt-3">
                  <div className="d-inline-block p-2 bg-light rounded border">
                    <small className="text-muted">
                      <strong>📄 Página {currentPage} de {totalPages}</strong> | 
                      Mostrando {indexOfFirstStudent + 1} a {Math.min(indexOfLastStudent, filteredStudents.length)} de {filteredStudents.length} estudiantes
                      {startDate && endDate && (
                        <span className="text-primary">
                          {' '}• Atrasos de {new Date(startDate).toLocaleDateString('es-CL')} a {new Date(endDate).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </small>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para composición del correo */}
      <Modal show={showEmailModal} onHide={handleCloseEmailModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEnvelope className="me-2" />
            Composición del Correo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Resumen de estudiantes seleccionados */}
          <Alert variant="info" className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Resumen:</strong> Se enviarán correos a {selectedStudents.filter(rut => 
                  filteredStudents.some(student => student.rut === rut)
                ).length} apoderado(s) de estudiantes seleccionados.
              </div>
              {startDate && endDate && (
                <Badge bg="primary">
                  📅 Período: {new Date(startDate).toLocaleDateString('es-CL')} - {new Date(endDate).toLocaleDateString('es-CL')}
                </Badge>
              )}
            </div>
            
            {/* Detalle de selección por filtro */}
            {startDate && endDate && (
              <div className="mt-2">
                <small className="text-muted">
                  <strong>Filtro activo:</strong> {selectedStudents.filter(rut => 
                    filteredStudents.some(student => student.rut === rut)
                  ).length} de {filteredStudents.length} estudiantes del período seleccionado
                </small>
              </div>
            )}
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Asunto del Correo</Form.Label>
              <Form.Control
                type="text"
                value={emailForm.asunto}
                onChange={(e) => setEmailForm({ ...emailForm, asunto: e.target.value })}
                placeholder="Asunto del correo"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Contenido del Correo</Form.Label>
              <Form.Control
                as="textarea"
                rows={12}
                value={emailForm.contenido}
                onChange={(e) => setEmailForm({ ...emailForm, contenido: e.target.value })}
                placeholder="Contenido del correo"
              />
              <Form.Text className="text-muted">
                <strong>Variables disponibles:</strong><br/>
                • {`{NOMBRE_ESTUDIANTE}`} - Nombre completo del estudiante<br/>
                • {`{CURSO}`} - Curso del estudiante<br/>
                • {`{TOTAL_ATRASOS}`} - Número total de atrasos<br/>
                • {`{DETALLE_ATRASOS}`} - Lista detallada de atrasos
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEmailModal}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendEmails} 
            disabled={sending}
          >
            {sending ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Enviando...</span>
                </div>
                Enviando...
              </>
            ) : (
              <>
                <FaEnvelope className="me-2" />
                📧 Enviar Correos
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

             {/* Modal de Confirmación Final - Extra ancho para muchos destinatarios */}
       <Modal 
         show={showConfirmationModal} 
         onHide={sending ? undefined : handleCloseConfirmationModal} 
         size="xl" 
         backdrop={sending ? 'static' : true}
         keyboard={!sending}
         centered
         style={{ maxWidth: '95vw', width: '95vw', zIndex: 2000 }}
       >
        <Modal.Header closeButton className="bg-light border-0 py-2">
          <Modal.Title className="fs-6 text-dark">
            <span className="me-2">📧</span>
            Confirmar Envío
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <div className="text-center mb-3">
            <h6 className="text-dark mb-3">¿Enviar correo a {selectedStudents.length} apoderado(s)?</h6>
            
            {/* Lista de destinatarios - Todos visibles y organizados */}
            <div className="bg-light p-3 rounded border mb-3">
              <small className="text-muted d-block mb-2">
                <strong>👥 Destinatarios ({selectedStudents.length}):</strong>
              </small>
              
              {/* Grid responsivo para todos los destinatarios */}
              <div className="row g-2">
                {students
                  .filter(student => selectedStudents.includes(student.rut))
                  .map((student) => (
                    <div key={student.rut} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div className="small p-2 bg-white rounded border h-100">
                        <div className="fw-bold text-dark text-truncate" title={`${student.nombres} ${student.apellidosPaterno}`}>
                          {student.nombres} {student.apellidosPaterno}
                        </div>
                        <div className="text-muted small">{student.curso}</div>
                        <div className="text-primary small text-truncate" title={student.correoApoderado}>
                          📧 {student.correoApoderado}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Resumen de la selección */}
              <div className="text-center mt-3 p-2 bg-white rounded">
                <small className="text-muted">
                  <strong>📊 Total de destinatarios: {selectedStudents.length}</strong>
                </small>
              </div>
            </div>
            
            {/* Resumen del correo */}
            <div className="bg-light p-2 rounded mb-3">
              <small className="text-muted">
                <strong>📄 Asunto:</strong> {emailForm.asunto}
              </small>
            </div>
          </div>

          {/* Advertencia sutil */}
          <div className="alert alert-warning py-2 mb-0 border-0">
            <small className="text-dark">
              <strong>⚠️</strong> Esta acción no se puede deshacer
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer className="py-2 border-0 justify-content-center">
          <Button variant="outline-secondary" size="sm" onClick={handleCloseConfirmationModal} disabled={sending}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmAndSendEmails}
            disabled={sending}
            size="sm"
            className="ms-2"
          >
            {sending ? (
              <>
                <div className="spinner-border spinner-border-sm me-1" role="status">
                  <span className="visually-hidden">Enviando...</span>
                </div>
                Enviando...
              </>
            ) : (
              <>
                📧 Enviar ({selectedStudents.length})
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

       {/* Botones flotantes de acción - Siempre visibles cuando hay selecciones */}
       {selectedStudents.length > 0 && (
         <div 
           className="position-fixed d-flex flex-column gap-2"
           style={{
             bottom: '30px',
             right: '30px',
             zIndex: 1050
           }}
         >
           {/* Botón de descarga PDF */}
           <Button 
             variant="info" 
             size="lg"
             onClick={handleDownloadPDF}
             className="shadow-lg btn-pdf"
             disabled={loading}
             style={{
               borderRadius: '50px',
               padding: '15px 25px',
               fontSize: '1.1rem',
               fontWeight: '600'
             }}
           >
             {loading ? (
               <>
                 <div className="spinner-border spinner-border-sm me-2" role="status">
                   <span className="visually-hidden">Generando...</span>
                 </div>
                 Generando PDF...
               </>
             ) : (
               <>
                 📄 Descargar PDF ({selectedStudents.length})
               </>
             )}
           </Button>

           {/* Botón de descarga Excel */}
           <Button 
             variant="success" 
             size="lg"
             onClick={handleDownloadExcel}
             className="shadow-lg btn-excel"
             disabled={loading}
             style={{
               borderRadius: '50px',
               padding: '15px 25px',
               fontSize: '1.1rem',
               fontWeight: '600'
             }}
           >
             {loading ? (
               <>
                 <div className="spinner-border spinner-border-sm me-2" role="status">
                   <span className="visually-hidden">Generando...</span>
                 </div>
                 Generando Excel...
               </>
             ) : (
               <>
                 <FaFileExcel className="me-2" />
                 Descargar Excel ({selectedStudents.length})
               </>
             )}
           </Button>
           
           {/* Botón de envío de correo */}
           <Button 
             variant="success" 
             size="lg"
             onClick={handleOpenEmailModal}
             className="shadow-lg"
             style={{
               borderRadius: '50px',
               padding: '15px 25px',
               fontSize: '1.1rem',
               fontWeight: '600'
             }}
           >
             <FaEnvelope className="me-2" />
             📧 Enviar Correo ({selectedStudents.length})
           </Button>
         </div>
       )}

       {/* Modal de Detalles de Conceptos */}
       <Modal 
         show={showDetailsModal} 
         onHide={() => setShowDetailsModal(false)} 
         size="xl" 
         centered
         backdrop="static"
         keyboard={false}
         style={{ zIndex: 2000 }}
       >
         <Modal.Header closeButton>
           <Modal.Title>
             📋 Conceptos de Atrasos - {selectedStudentDetails?.nombres} {selectedStudentDetails?.apellidosPaterno}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {selectedStudentDetails && (
             <div>
               <div className="mb-3">
                 <strong>Estudiante:</strong> {selectedStudentDetails.nombres} {selectedStudentDetails.apellidosPaterno} {selectedStudentDetails.apellidosMaterno}
                 <br />
                 <strong>Curso:</strong> {selectedStudentDetails.curso}
                 <br />
                 <strong>RUT:</strong> {selectedStudentDetails.rut}
               </div>
               
               <h6>Historial Completo de Conceptos de Atrasos:</h6>
               <div className="table-responsive">
                 <Table striped bordered hover size="sm">
                   <thead>
                     <tr>
                       <th>Fecha</th>
                       <th>Hora</th>
                       <th>Concepto</th>
                       <th>Certificado Médico</th>
                       <th>Motivo</th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedStudentDetails.atrasos?.map((atraso, index) => (
                       <tr key={index}>
                         <td>{new Date(atraso.fecha).toLocaleDateString('es-CL')}</td>
                         <td>{atraso.hora}</td>
                         <td>
                           <Badge bg={getConceptoColor(atraso.concepto)}>
                             {getConceptoLabel(atraso.concepto)}
                           </Badge>
                         </td>
                         <td>
                           {atraso.concepto === 'ausente' ? (
                             <span className="text-danger">✗ No</span>
                           ) : atraso.concepto === 'atrasado-presente' ? (
                             <div className="d-flex align-items-center gap-2">
                               <span className="text-success">✓ Sí</span>
                               {atraso.trajoCertificado && atraso.certificadoAdjunto && (
                                 <Button 
                                   variant="outline-primary" 
                                   size="sm"
                                   onClick={() => handleDownloadCertificate(atraso.certificadoAdjunto)}
                                   title="Descargar certificado médico"
                                 >
                                   📄 Descargar
                                 </Button>
                                 )}
                               {atraso.trajoCertificado && !atraso.certificadoAdjunto && (
                                 <small className="text-warning" title="El certificado fue reportado pero el archivo no está disponible">
                                   ⚠️ Sin archivo
                                 </small>
                               )}
                               </div>
                           ) : atraso.concepto === 'presente' ? (
                             <span className="text-muted">No aplica</span>
                           ) : (
                             <span className="text-muted">No aplica</span>
                           )}
                         </td>
                         <td>{atraso.motivo}</td>
                       </tr>
                     ))}
                   </tbody>
                 </Table>
               </div>
               
               {selectedStudentDetails.atrasos?.length === 0 && (
                 <Alert variant="info">No hay atrasos registrados para este estudiante.</Alert>
               )}
             </div>
           )}
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
             Cerrar
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Modal de Análisis de Puntualidad */}
       <Modal 
         show={showPunctualityModal} 
         onHide={() => setShowPunctualityModal(false)} 
         size="xl" 
         centered
         backdrop="static"
         keyboard={false}
         style={{ zIndex: 2000 }}
       >
         <Modal.Header closeButton>
           <Modal.Title>
             📊 Análisis de Puntualidad - {selectedStudentPunctuality?.nombres} {selectedStudentPunctuality?.apellidosPaterno}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {selectedStudentPunctuality && (
             <div>
               <div className="mb-4">
                 <strong>Estudiante:</strong> {selectedStudentPunctuality.nombres} {selectedStudentPunctuality.apellidosPaterno} {selectedStudentPunctuality.apellidosMaterno}
                 <br />
                 <strong>Curso:</strong> {selectedStudentPunctuality.curso}
                 <br />
                 <strong>RUT:</strong> {selectedStudentPunctuality.rut}
               </div>
               
               <h6>Análisis de Puntualidad por Mes - Año 2025:</h6>
               <div className="table-responsive">
                 <Table striped bordered hover size="sm">
                   <thead>
                     <tr>
                       <th>Mes</th>
                       <th>Días Hábiles</th>
                       <th>Atrasos</th>
                       <th>Días Puntuales</th>
                       <th>Porcentaje</th>
                       <th>Calificación</th>
                     </tr>
                   </thead>
                   <tbody>
                     {Array.from({ length: 12 }, (_, index) => {
                       const month = index + 1;
                       const punctuality = calculateMonthlyPunctuality(selectedStudentPunctuality, month, 2025);
                       
                       return (
                         <tr key={month}>
                           <td>
                             <strong>{new Date(2025, month - 1, 1).toLocaleDateString('es-CL', { month: 'long' })}</strong>
                           </td>
                           <td className="text-center">{punctuality.workingDays}</td>
                           <td className="text-center">
                             <Badge bg={punctuality.tardiness > 0 ? 'danger' : 'success'}>
                               {punctuality.tardiness}
                             </Badge>
                           </td>
                           <td className="text-center">
                             <Badge bg={punctuality.punctualDays > 0 ? 'success' : 'secondary'}>
                               {punctuality.punctualDays}
                             </Badge>
                           </td>
                           <td className="text-center">
                             <Badge bg={punctuality.color} style={{ fontSize: '1rem' }}>
                               {punctuality.percentage}%
                             </Badge>
                           </td>
                           <td className="text-center">
                             <Badge bg={punctuality.color} variant="outline">
                               {punctuality.grade}
                             </Badge>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </Table>
               </div>
               
               {/* Resumen del año */}
               <div className="mt-4 p-3 bg-light rounded border">
                 <h6>📈 Resumen del Año Escolar:</h6>
                 <div className="row">
                   <div className="col-md-6">
                     <strong>Total de días hábiles:</strong> 209 días
                     <br />
                     <strong>Total de atrasos:</strong> {selectedStudentPunctuality.totalAtrasos || 0} días
                   </div>
                   <div className="col-md-6">
                     <strong>Promedio anual:</strong> {(() => {
                       const totalWorkingDays = 209;
                       const totalTardiness = selectedStudentPunctuality.totalAtrasos || 0;
                       const annualPercentage = totalWorkingDays > 0 ? Math.round(((totalWorkingDays - totalTardiness) / totalWorkingDays) * 100) : 100;
                       return `${annualPercentage}%`;
                     })()} de puntualidad
                   </div>
                 </div>
               </div>
             </div>
           )}
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowPunctualityModal(false)}>
             Cerrar
           </Button>
         </Modal.Footer>
       </Modal>
     </Container>
   );
 };

export default Notifications;
