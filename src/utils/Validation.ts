// ============================================
// VALIDACIÓN DE RUT CHILENO
// ============================================

export const validarRUT = (rut: string): boolean => {
  // Limpiar RUT: quitar puntos y guión
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (rut.length < 2) return false;
  
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  
  // Validar que el cuerpo sea numérico
  if (!/^\d+$/.test(cuerpo)) return false;
  
  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const dvEsperado = 11 - (suma % 11);
  let dvCalculado: string;
  
  if (dvEsperado === 11) dvCalculado = '0';
  else if (dvEsperado === 10) dvCalculado = 'K';
  else dvCalculado = dvEsperado.toString();
  
  return dv === dvCalculado;
};

export const formatearRUT = (rut: string): string => {
  // Limpiar RUT: dejar solo números y K/k
  rut = rut.replace(/[^\dKk]/g, '').toUpperCase();
  
  if (rut.length < 2) return rut;
  
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  
  // Agregar puntos cada 3 dígitos
  let rutFormateado = '';
  let contador = 0;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    rutFormateado = cuerpo[i] + rutFormateado;
    contador++;
    if (contador === 3 && i !== 0) {
      rutFormateado = '.' + rutFormateado;
      contador = 0;
    }
  }
  
  return rutFormateado + '-' + dv;
};

export const validarRUTEnTiempoReal = (rut: string): { isValid: boolean; formattedRUT: string } => {
  if (!rut || rut.length === 0) {
    return { isValid: false, formattedRUT: '' };
  }
  
  const isValid = validarRUT(rut);
  const formattedRUT = isValid ? formatearRUT(rut) : rut;
  
  return { isValid, formattedRUT };
};

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

export const escaparHtml = (texto: string): string => {
  if (!texto) return '';
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

export const validarFormularioArticulo = (articulo: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!articulo.rut || articulo.rut.trim() === '') {
    errors.push('El RUT es obligatorio');
  } else if (!validarRUT(articulo.rut)) {
    errors.push('El RUT no es válido');
  }

  if (!articulo.nombreCliente || articulo.nombreCliente.trim() === '') {
    errors.push('El nombre del cliente es obligatorio');
  }

  if (!articulo.tipoArticulo || articulo.tipoArticulo.trim() === '') {
    errors.push('El tipo de artículo es obligatorio');
  }

  if (!articulo.descripcion || articulo.descripcion.trim() === '') {
    errors.push('La descripción es obligatoria');
  }

  if (!articulo.numeroBodega || articulo.numeroBodega.trim() === '') {
    errors.push('El número de bodega es obligatorio');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};