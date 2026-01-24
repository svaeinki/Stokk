import { ZodIssue } from 'zod';
import { Articulo } from '../database/DatabaseManager';
import {
  validarArticulo,
  validarArticuloParaActualizar,
  CrearArticuloInput,
  ActualizarArticuloInput
} from '../validation/schemas';
import { createValidationError } from '../types/errors';
import Logger from './Logger';

// ============================================
// VALIDACIÓN DE RUT CHILENO
// ============================================

// ============================================
// UTILIDADES DE FORMATO
// ============================================

export const formatearMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(valor || 0);
};

export const formatearNumero = (valor: number): string => {
  return new Intl.NumberFormat('es-CL').format(valor || 0);
};

const parseFechaIngreso = (fechaIngreso: string): Date | null => {
  if (!fechaIngreso) return null;
  const fechaParte = fechaIngreso.split(',')[0].trim();
  const formatoLatino = /^\d{2}\/\d{2}\/\d{4}/.test(fechaParte);

  if (formatoLatino) {
    const [dia, mes, anio] = fechaParte.split('/').map(num => parseInt(num, 10));
    if (!dia || !mes || !anio) return null;
    return new Date(anio, mes - 1, dia);
  }

  const parsed = new Date(fechaIngreso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const calcularDiasEnBodega = (fechaIngreso: string): string => {
  try {
    const fecha = parseFechaIngreso(fechaIngreso);
    if (!fecha) return 'Fecha inválida';

    const ahora = new Date();
    fecha.setHours(0, 0, 0, 0);
    ahora.setHours(0, 0, 0, 0);

    const diferencia = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 0) return 'Fecha futura';
    if (dias < 30) return `Hace ${dias} días`;
    if (dias < 60) return 'Hace 1 mes';
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return `Hace ${Math.floor(dias / 365)} años`;
  } catch (error) {
    Logger.error('Error calculando días', error);
    return 'N/A';
  }
};

export const obtenerClaseAlerta = (fechaIngreso: string): string => {
  try {
    const fecha = parseFechaIngreso(fechaIngreso);
    if (!fecha) return '';

    const ahora = new Date();
    const dias = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

    if (dias >= 60) return 'alerta-critica';
    if (dias >= 30) return 'alerta-warning';
    return '';
  } catch (error) {
    return '';
  }
};


// ============================================
// GENERACIÓN DE NÚMERO DE BODEGA
// ============================================

export const generarNumeroBodega = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `B${timestamp.slice(-6)}${random}`;
};

// ============================================
// VALIDACIÓN DE FORMULARIOS CON ZOD
// ============================================

export const validarFormularioArticulo = (articulo: Partial<Articulo>): { isValid: boolean; errors: string[] } => {
  // Si es un nuevo artículo (sin id), usar schema de creación
  if (!articulo.id) {
    const resultado = validarArticulo(articulo);

    if (resultado.success) {
      return { isValid: true, errors: [] };
    } else {
      const errors = resultado.error.issues.map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return { isValid: false, errors };
    }
  }

  // Para actualizaciones, validar solo los campos proporcionados
  const resultado = validarArticuloParaActualizar(articulo);
  
  if (resultado.success) {
    return { isValid: true, errors: [] };
  } else {
    const errors = resultado.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    return { isValid: false, errors };
  }
};

// Validación tipada para creación de artículos
export const validarCreacionArticulo = (data: CrearArticuloInput): { isValid: boolean; errors: string[] } => {
  const resultado = validarArticulo(data);
  
  if (resultado.success) {
    return { isValid: true, errors: [] };
  } else {
    const errors = resultado.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    return { isValid: false, errors };
  }
};

// Validación tipada para actualización de artículos
export const validarActualizacionArticulo = (data: ActualizarArticuloInput): { isValid: boolean; errors: string[] } => {
  const resultado = validarArticuloParaActualizar(data);
  
  if (resultado.success) {
    return { isValid: true, errors: [] };
  } else {
    const errors = resultado.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    return { isValid: false, errors };
  }
};

// Validación con error types mejorados
export const validarArticuloConTipos = (articulo: Partial<Articulo>) => {
  const resultado = !articulo.id ? validarArticulo(articulo) : validarArticuloParaActualizar(articulo);
  
  if (resultado.success) {
    return { 
      success: true as const,
      data: resultado.data 
    };
  } else {
    const error = createValidationError(
      'Validación de artículo fallida',
      'articulo',
      resultado.error.issues.map((issue: ZodIssue) => issue.message)
    );
    
    return { 
      success: false as const,
      error 
    };
  }
};
