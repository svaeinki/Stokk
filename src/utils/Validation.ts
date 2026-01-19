import { Articulo } from '../database/DatabaseManager';

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

export const calcularDiasEnBodega = (fechaIngreso: string): string => {
  try {
    // Asumir formato dd/mm/yyyy hh:mm:ss o dd/mm/yyyy
    const fechaParte = fechaIngreso.split(',')[0].trim();
    const [dia, mes, anio] = fechaParte.split('/').map(num => parseInt(num, 10));

    if (!dia || !mes || !anio) return 'Fecha inválida';

    // Mes en JavaScript es 0-11
    const fecha = new Date(anio, mes - 1, dia);
    const ahora = new Date();

    // Resetear horas para comparar solo días
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
    console.error('Error calculando días:', error);
    return 'N/A';
  }
};

export const obtenerClaseAlerta = (fechaIngreso: string): string => {
  try {
    const partes = fechaIngreso.split(',')[0].trim().split('/');
    const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
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
// VALIDACIÓN DE FORMULARIOS
// ============================================

export const validarFormularioArticulo = (articulo: Partial<Articulo>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!articulo.nombre || articulo.nombre.trim() === '') {
    errors.push('El nombre del producto es obligatorio');
  }

  if (articulo.precio === undefined || articulo.precio < 0) {
    errors.push('El precio debe ser mayor o igual a 0');
  }

  if (articulo.cantidad === undefined || articulo.cantidad < 0) {
    errors.push('La cantidad debe ser mayor o igual a 0');
  }

  if (!articulo.numeroBodega || articulo.numeroBodega.trim() === '') {
    errors.push('El número de bodega es obligatorio');
  }

  if (!articulo.fechaIngreso) {
    errors.push('La fecha de ingreso es obligatoria');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};