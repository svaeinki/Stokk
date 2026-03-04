import { ZodIssue } from 'zod';
import { Articulo } from '../database/DatabaseManager';
import {
  validarArticulo,
  validarArticuloParaActualizar,
  CrearArticuloInput,
} from '../validation/schemas';

// ============================================
// UTILIDADES DE FORMATO
// ============================================

export const formatearMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(valor || 0);
};

// ============================================
// VALIDACIÓN DE FORMULARIOS CON ZOD
// ============================================

export const validarFormularioArticulo = (
  articulo: Partial<Articulo>
): { isValid: boolean; errors: string[] } => {
  // Si es un nuevo artículo (sin id), usar schema de creación
  if (!articulo.id) {
    const resultado = validarArticulo(articulo);

    if (resultado.success) {
      return { isValid: true, errors: [] };
    } else {
      const errors = resultado.error.issues.map(
        (issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`
      );
      return { isValid: false, errors };
    }
  }

  // Para actualizaciones, validar solo los campos proporcionados
  const resultado = validarArticuloParaActualizar(articulo);

  if (resultado.success) {
    return { isValid: true, errors: [] };
  } else {
    const errors = resultado.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    );
    return { isValid: false, errors };
  }
};

// Validación tipada para creación de artículos
export const validarCreacionArticulo = (
  data: CrearArticuloInput
): { isValid: boolean; errors: string[] } => {
  const resultado = validarArticulo(data);

  if (resultado.success) {
    return { isValid: true, errors: [] };
  } else {
    const errors = resultado.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    );
    return { isValid: false, errors };
  }
};
