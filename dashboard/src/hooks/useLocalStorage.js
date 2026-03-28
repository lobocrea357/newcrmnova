'use client'

import { useState, useEffect } from "react";

/**
 * Hook para manejar estado sincronizado con localStorage
 * @param {string} key - Clave de localStorage
 * @param {any} initialValue - Valor inicial si no existe en localStorage
 * @returns {[any, function, function]} - [valor, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Estado interno con inicialización desde localStorage
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Guardar en localStorage cuando cambia el valor
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Función para eliminar del localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Retornar como array para usar con desestructuración
  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;