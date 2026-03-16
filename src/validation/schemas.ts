import { z } from 'zod';
import i18n from '../i18n';
import { Articulo } from '../database/DatabaseManager';

// Helper: get translated validation message at call time
const t = (key: string) => i18n.t(key);

// Validation for date values (DD/MM/YYYY or ISO)
const esFechaValida = (value: string): boolean => {
  if (!value) return false;

  // Check DD/MM/YYYY format with actual date validation
  const latinMatch = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(\s\d{2}:\d{2}:\d{2})?$/
  );
  if (latinMatch) {
    const day = parseInt(latinMatch[1], 10);
    const month = parseInt(latinMatch[2], 10);
    const year = parseInt(latinMatch[3], 10);
    if (month < 1 || month > 12 || day < 1 || year < 1) return false;
    // Use Date to validate day-of-month (handles leap years, 30/31 days)
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  // Fallback: ISO or other parseable format
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

// Validation for image URIs
export const esUriValido = (uri: string): boolean => {
  if (!uri) return false;

  // Accept local React Native URIs
  if (uri.startsWith('file://') || uri.startsWith('content://')) return true;

  // Accept asset URIs
  if (uri.startsWith('asset://')) return true;

  // Accept http/https URIs (remote images)
  try {
    new URL(uri);
    return uri.startsWith('http://') || uri.startsWith('https://');
  } catch {
    return false;
  }
};

// --- Schema factories (create schemas with current locale messages) ---

const createNumeroBodegaSchema = () =>
  z
    .string()
    .max(50, t('validation.location_max'))
    .trim()
    .optional()
    .nullable();

const createFechaSchema = () =>
  z
    .string()
    .min(1, t('validation.date_required'))
    .refine(esFechaValida, t('validation.date_format'));

const createImagenUriSchema = () =>
  z
    .string()
    .min(1, t('validation.image_uri_required'))
    .refine(esUriValido, t('validation.image_uri_invalid'))
    .or(z.literal(''))
    .nullable()
    .optional();

const createObservacionesSchema = () =>
  z
    .string()
    .max(1000, t('validation.notes_max'))
    .trim()
    .optional()
    .nullable();

const createArticuloSchema = () =>
  z.object({
    id: z.number().optional(),
    nombre: z
      .string()
      .min(1, t('validation.name_required'))
      .max(100, t('validation.name_max'))
      .trim(),
    descripcion: z
      .string()
      .max(500, t('validation.description_max'))
      .trim()
      .optional()
      .nullable(),
    precio: z
      .number()
      .min(0, t('validation.price_min'))
      .max(999999999, t('validation.price_max'))
      .default(0),
    cantidad: z
      .number()
      .int(t('validation.quantity_integer'))
      .min(0, t('validation.quantity_min'))
      .max(999999, t('validation.quantity_max'))
      .default(1),
    imagen: createImagenUriSchema(),
    numeroBodega: createNumeroBodegaSchema(),
    observaciones: createObservacionesSchema(),
    fechaIngreso: createFechaSchema(),
    fechaModificacion: createFechaSchema().optional().nullable(),
  });

const createCrearArticuloSchema = () =>
  createArticuloSchema().omit({
    id: true,
    fechaModificacion: true,
  });

const createActualizarArticuloSchema = () =>
  z.object({
    id: z.number().positive(t('validation.id_positive')),
    nombre: z
      .string()
      .min(1, t('validation.name_required'))
      .max(100, t('validation.name_max'))
      .trim()
      .optional(),
    descripcion: z
      .string()
      .max(500, t('validation.description_max'))
      .trim()
      .optional()
      .nullable(),
    precio: z
      .number()
      .min(0, t('validation.price_min'))
      .max(999999999, t('validation.price_max'))
      .optional(),
    cantidad: z
      .number()
      .int(t('validation.quantity_integer'))
      .min(0, t('validation.quantity_min'))
      .max(999999, t('validation.quantity_max'))
      .optional(),
    imagen: createImagenUriSchema(),
    numeroBodega: createNumeroBodegaSchema().optional(),
    observaciones: createObservacionesSchema(),
  });

const createBusquedaSchema = () =>
  z.object({
    termino: z
      .string()
      .min(1, t('validation.search_required'))
      .max(100, t('validation.search_max'))
      .trim(),
  });

const createPaginacionSchema = () =>
  z.object({
    pagina: z.coerce
      .number()
      .int()
      .min(1, t('validation.page_min'))
      .default(1),
    limite: z.coerce
      .number()
      .int()
      .min(1, t('validation.limit_min'))
      .max(100, t('validation.limit_max'))
      .default(20),
  });

const createFiltroBusquedaSchema = () =>
  z.object({
    nombre: z.string().trim().optional(),
    descripcion: z.string().trim().optional(),
    numeroBodega: z.string().trim().optional(),
    precioMin: z.coerce.number().min(0).optional(),
    precioMax: z.coerce.number().min(0).optional(),
    cantidadMin: z.coerce.number().int().min(0).optional(),
    cantidadMax: z.coerce.number().int().min(0).optional(),
    fechaDesde: createFechaSchema().optional(),
    fechaHasta: createFechaSchema().optional(),
  });

// --- Static schemas for type inference ---

export const articuloSchema = createArticuloSchema();
export const crearArticuloSchema = createCrearArticuloSchema();
export const actualizarArticuloSchema = createActualizarArticuloSchema();
export const busquedaSchema = createBusquedaSchema();
export const paginacionSchema = createPaginacionSchema();
export const filtroBusquedaSchema = createFiltroBusquedaSchema();

// --- TypeScript types generated from schemas ---

export type CrearArticuloInput = z.infer<typeof crearArticuloSchema>;
export type ActualizarArticuloInput = z.infer<typeof actualizarArticuloSchema>;
export type BusquedaInput = z.infer<typeof busquedaSchema>;
export type PaginacionInput = z.infer<typeof paginacionSchema>;
export type FiltroBusquedaInput = z.infer<typeof filtroBusquedaSchema>;

// --- Validation functions (create fresh schemas with current locale) ---

export const validarArticulo = (data: unknown) => {
  return createCrearArticuloSchema().safeParse(data);
};

export const validarArticuloParaActualizar = (data: unknown) => {
  return createActualizarArticuloSchema().safeParse(data);
};

export const validarBusqueda = (data: unknown) => {
  return createBusquedaSchema().safeParse(data);
};

export const validarPaginacion = (data: unknown) => {
  return createPaginacionSchema().safeParse(data);
};

export const validarFiltroBusqueda = (data: unknown) => {
  return createFiltroBusquedaSchema().safeParse(data);
};
