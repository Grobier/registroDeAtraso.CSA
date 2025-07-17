import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/activity-log`);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Función para borrar un registro
  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas borrar este registro?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity-log/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setLogs(logs.filter((log) => log._id !== id));
      } else {
        alert('No se pudo borrar el registro');
      }
    } catch (err) {
      alert('Error al borrar el registro');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Historial de Actividad</h2>
      {loading && <p>Cargando...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Detalles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.details}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(log._id)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ActivityLog; 