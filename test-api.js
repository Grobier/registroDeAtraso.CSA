// Script de prueba para verificar la API
const https = require('https');
const http = require('http');

console.log('🔍 Probando API de notificaciones...');

// Función para hacer petición HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve(data); // Si no es JSON, devolver como texto
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Probar la API
async function testAPI() {
  try {
    console.log('📡 Haciendo petición a: http://localhost:5000/api/notifications/students-with-tardiness');
    
    const response = await makeRequest('http://localhost:5000/api/notifications/students-with-tardiness');
    
    console.log('✅ Respuesta recibida:');
    console.log('📊 Total de estudiantes:', response.length || 'No es un array');
    
    if (Array.isArray(response) && response.length > 0) {
      console.log('🔍 Primer estudiante:');
      console.log('   RUT:', response[0].rut);
      console.log('   Nombre:', response[0].nombres);
      console.log('   Total Atrasos:', response[0].totalAtrasos);
      
      if (response[0].atrasos && response[0].atrasos.length > 0) {
        console.log('   Primer atraso:');
        console.log('     Fecha:', response[0].atrasos[0].fecha);
        console.log('     Hora:', response[0].atrasos[0].hora);
        console.log('     Concepto:', response[0].atrasos[0].concepto || 'NO DEFINIDO');
        console.log('     Trajo Certificado:', response[0].atrasos[0].trajoCertificado || 'NO DEFINIDO');
      } else {
        console.log('   ⚠️ No hay atrasos en el primer estudiante');
      }
    }
    
    // Verificar si hay conceptos
    const conceptos = response.filter(s => s.atrasos?.[0]?.concepto).map(s => s.atrasos[0].concepto);
    const conceptosUnicos = [...new Set(conceptos)];
    
    console.log('\n📋 Conceptos encontrados:', conceptosUnicos);
    console.log('📊 Distribución de conceptos:');
    
    conceptosUnicos.forEach(concepto => {
      const count = conceptos.filter(c => c === concepto).length;
      console.log(`   ${concepto}: ${count} estudiantes`);
    });
    
  } catch (error) {
    console.error('❌ Error al probar la API:', error.message);
  }
}

// Ejecutar la prueba
testAPI();
