// hooks/useManualTardiness.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'manualTardinessRecords';

export const useManualTardiness = () => {
  const [manualRecords, setManualRecords] = useState([]);

  // Cargar registros manuales del localStorage al inicializar
  useEffect(() => {
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    if (savedRecords) {
      try {
        const parsedRecords = JSON.parse(savedRecords);
        setManualRecords(parsedRecords);
        console.log('📱 Registros manuales cargados:', parsedRecords.length);
      } catch (error) {
        console.error('Error al cargar registros manuales:', error);
        setManualRecords([]);
      }
    }
  }, []);

  // Guardar un nuevo registro manual
  const addManualRecord = (record) => {
    const newRecord = {
      ...record,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      sincronizado: false,
      tipo: 'manual'
    };

    const updatedRecords = [...manualRecords, newRecord];
    setManualRecords(updatedRecords);
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    
    console.log('💾 Registro manual guardado:', newRecord);
    return newRecord;
  };

  // Marcar registros como sincronizados
  const markAsSynced = useCallback((recordIds) => {
    const updatedRecords = manualRecords.map(record => 
      recordIds.includes(record.id) 
        ? { ...record, sincronizado: true }
        : record
    );
    
    setManualRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    
    console.log('✅ Registros marcados como sincronizados:', recordIds);
  }, [manualRecords]);

  // Eliminar registros sincronizados
  const removeSyncedRecords = useCallback(() => {
    const pendingRecords = manualRecords.filter(record => !record.sincronizado);
    setManualRecords(pendingRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingRecords));
    
    console.log('🗑️ Registros sincronizados eliminados');
  }, [manualRecords]);

  // Obtener registros pendientes de sincronización
  const getPendingRecords = useCallback(() => {
    return manualRecords.filter(record => !record.sincronizado);
  }, [manualRecords]);

  // Limpiar todos los registros (para testing)
  const clearAllRecords = () => {
    setManualRecords([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Todos los registros manuales eliminados');
  };

  return {
    manualRecords,
    addManualRecord,
    markAsSynced,
    removeSyncedRecords,
    getPendingRecords,
    clearAllRecords
  };
};
