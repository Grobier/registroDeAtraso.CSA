import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pendingTardiness';

const usePendingTardiness = () => {
  const [pendingTardiness, setPendingTardiness] = useState([]);

  // Cargar atrasos pendientes del localStorage al inicializar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPendingTardiness(parsed);
        console.log('📱 Atrasos pendientes cargados:', parsed.length);
      } catch (error) {
        console.error('Error al cargar atrasos pendientes:', error);
        setPendingTardiness([]);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingTardiness));
  }, [pendingTardiness]);

  const addPendingTardiness = (tardiness) => {
    const newTardiness = {
      ...tardiness,
      id: Date.now() + Math.random(), // ID único
      timestamp: new Date().toISOString(),
      sincronizado: false,
      tipo: 'manual'
    };
    
    setPendingTardiness(prev => [...prev, newTardiness]);
    console.log('📱 Atraso agregado a pendientes:', newTardiness);
    return newTardiness.id;
  };

  const removePendingTardiness = (id) => {
    setPendingTardiness(prev => prev.filter(t => t.id !== id));
    console.log('📱 Atraso eliminado de pendientes:', id);
  };

  const markAsSynced = (id) => {
    setPendingTardiness(prev => prev.filter(t => t.id !== id));
    console.log('📱 Atraso sincronizado y eliminado:', id);
  };

  const clearAllPending = () => {
    setPendingTardiness([]);
    console.log('📱 Todos los atrasos pendientes eliminados');
  };

  const getPendingCount = () => {
    return pendingTardiness.length;
  };

  return {
    pendingTardiness,
    addPendingTardiness,
    removePendingTardiness,
    markAsSynced,
    clearAllPending,
    getPendingCount
  };
};

export default usePendingTardiness;
