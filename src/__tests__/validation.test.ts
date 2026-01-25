import { 
  validarArticulo, 
  CrearArticuloInput 
} from '../validation/schemas';
import { validarCreacionArticulo } from '../utils/Validation';

describe('Validation Schemas', () => {
  const validArticulo: CrearArticuloInput = {
    nombre: 'Test Product',
    descripcion: 'Test Description',
    precio: 100,
    cantidad: 5,
    imagen: 'file://test.jpg',
    numeroBodega: 'Estante A3',
    observaciones: 'Test Notes',
    fechaIngreso: '23/01/2026',
  };

  describe('validarArticulo', () => {
    it('should validate a correct article', () => {
      const result = validarArticulo(validArticulo);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nombre).toBe('Test Product');
      }
    });

    it('should reject article with empty name', () => {
      const invalidArticulo = { ...validArticulo, nombre: '' };
      const result = validarArticulo(invalidArticulo);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('requerido');
      }
    });

    it('should reject article with negative price', () => {
      const invalidArticulo = { ...validArticulo, precio: -10 };
      const result = validarArticulo(invalidArticulo);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayor o igual a 0');
      }
    });

    it('should accept article with empty location code', () => {
      const articuloSinCodigo = { ...validArticulo, numeroBodega: '' };
      const result = validarArticulo(articuloSinCodigo);

      expect(result.success).toBe(true);
    });

    it('should accept article with custom location text', () => {
      const articuloConUbicacion = { ...validArticulo, numeroBodega: 'Bodega Norte - Pasillo 3' };
      const result = validarArticulo(articuloConUbicacion);

      expect(result.success).toBe(true);
    });
  });

  describe('validarCreacionArticulo', () => {
    it('should validate creation input correctly', () => {
      const result = validarCreacionArticulo(validArticulo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid input', () => {
      const invalidArticulo = { ...validArticulo, nombre: '', precio: -5 };
      const result = validarCreacionArticulo(invalidArticulo);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});