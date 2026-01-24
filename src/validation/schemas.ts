import { z } from 'zod';
import { Articulo } from '../database/DatabaseManager';

// Validación del número de bodega (formato: B123456789)
const numeroBodegaSchema = z
  .string()
  .min(1, 'El número de bodega es requerido')
  .regex(/^B\d{9}$/, 'El número de bodega debe tener formato B123456789');

const esFechaValida = (value: string): boolean => {
  if (!value) return false;
  const esFormatoLatino = /^\d{2}\/\d{2}\/\d{4}(\s\d{2}:\d{2}:\d{2})?$/.test(value);
  if (esFormatoLatino) return true;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

// Validación de fecha (acepta DD/MM/YYYY o ISO)
const fechaSchema = z
  .string()
  .min(1, 'La fecha es requerida')
  .refine(esFechaValida, 'La fecha debe tener formato DD/MM/YYYY o ISO');

// Validación personalizada para URI de imágenes
export const esUriValido = (uri: string): boolean => {
  if (!uri) return false;
  
  // Aceptar URIs locales de React Native
  if (uri.startsWith('file://') || uri.startsWith('content://')) return true;
  
  // Aceptar URIs de assets
  if (uri.startsWith('asset://')) return true;
  
  // Aceptar URIs http/https (para imágenes remotas)
  try {
    new URL(uri);
    return uri.startsWith('http://') || uri.startsWith('https://');
  } catch {
    return false;
  }
};

// Schema modificado para aceptar URIs de imágenes locales
const imagenUriSchema = z
  .string()
  .min(1, 'La URI de la imagen es requerida')
  .refine(esUriValido, 'La URI de la imagen no es válida')
  .or(z.literal(''))
  .nullable()
  .optional();

// Schema principal para Articulo
export const articuloSchema = z.object({
  id: z.number().optional(),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  precio: z
    .number()
    .min(0, 'El precio debe ser mayor o igual a 0')
    .max(999999999, 'El precio no puede exceder 999.999.999')
    .default(0),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad debe ser mayor o igual a 0')
    .max(999999, 'La cantidad no puede exceder 999.999')
    .default(1),
  imagen: imagenUriSchema,
  numeroBodega: numeroBodegaSchema,
  observaciones: z
    .string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .trim()
    .optional()
    .nullable(),
  fechaIngreso: fechaSchema,
  fechaModificacion: fechaSchema.optional().nullable(),
});

// Schema para crear un nuevo artículo (sin id)
export const crearArticuloSchema = articuloSchema.omit({
  id: true,
  fechaModificacion: true,
});

// Schema para actualizar un artículo (todos los campos opcionales excepto id)
export const actualizarArticuloSchema = z.object({
  id: z.number().positive('El ID debe ser un número positivo'),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  precio: z
    .number()
    .min(0, 'El precio debe ser mayor o igual a 0')
    .max(999999999, 'El precio no puede exceder 999.999.999')
    .optional(),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad debe ser mayor o igual a 0')
    .max(999999, 'La cantidad no puede exceder 999.999')
    .optional(),
  imagen: imagenUriSchema,
  numeroBodega: numeroBodegaSchema.optional(),
  observaciones: z
    .string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .trim()
    .optional()
    .nullable(),
});

// Schema para búsqueda
export const busquedaSchema = z.object({
  termino: z
    .string()
    .min(1, 'El término de búsqueda es requerido')
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
    .trim(),
});

// Schema para paginación
export const paginacionSchema = z.object({
  pagina: z.coerce.number().int().min(1, 'La página debe ser mayor a 0').default(1),
  limite: z.coerce.number().int().min(1, 'Límite debe ser mayor a 0').max(100, 'Límite máximo es 100').default(20),
});

// Schema para filtros de búsqueda avanzada
export const filtroBusquedaSchema = z.object({
  nombre: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  numeroBodega: z.string().trim().optional(),
  precioMin: z.coerce.number().min(0).optional(),
  precioMax: z.coerce.number().min(0).optional(),
  cantidadMin: z.coerce.number().int().min(0).optional(),
  cantidadMax: z.coerce.number().int().min(0).optional(),
  fechaDesde: fechaSchema.optional(),
  fechaHasta: fechaSchema.optional(),
});

// Tipos TypeScript generados desde los schemas
export type CrearArticuloInput = z.infer<typeof crearArticuloSchema>;
export type ActualizarArticuloInput = z.infer<typeof actualizarArticuloSchema>;
export type BusquedaInput = z.infer<typeof busquedaSchema>;
export type PaginacionInput = z.infer<typeof paginacionSchema>;
export type FiltroBusquedaInput = z.infer<typeof filtroBusquedaSchema>;

// Funciones de validación
export const validarArticulo = (data: unknown) => {
  return crearArticuloSchema.safeParse(data);
};

export const validarArticuloParaActualizar = (data: unknown) => {
  return actualizarArticuloSchema.safeParse(data);
};

export const validarBusqueda = (data: unknown) => {
  return busquedaSchema.safeParse(data);
};

export const validarPaginacion = (data: unknown) => {
  return paginacionSchema.safeParse(data);
};

export const validarFiltroBusqueda = (data: unknown) => {
  return filtroBusquedaSchema.safeParse(data);
};

// Función para transformar datos parciales a tipos válidos
export const transformarParcialArticulo = (partial: Partial<Articulo>): Partial<Articulo> => {
  const transformado: Partial<Articulo> = {};
  
  if (partial.nombre !== undefined) transformado.nombre = partial.nombre.trim();
  if (partial.descripcion !== undefined) transformado.descripcion = partial.descripcion?.trim() || undefined;
  if (partial.precio !== undefined) transformado.precio = Number(partial.precio);
  if (partial.cantidad !== undefined) transformado.cantidad = Number(partial.cantidad);
  if (partial.numeroBodega !== undefined) transformado.numeroBodega = partial.numeroBodega.trim();
  if (partial.observaciones !== undefined) transformado.observaciones = partial.observaciones?.trim() || undefined;
  if (partial.imagen !== undefined) transformado.imagen = partial.imagen || undefined;
  if (partial.fechaIngreso !== undefined) transformado.fechaIngreso = partial.fechaIngreso;
  
  return transformado;
};

// Schema principal con URI de imagen válida
export const articuloSchemaConUri = articuloSchema.extend({
  imagen: imagenUriSchema,
});
