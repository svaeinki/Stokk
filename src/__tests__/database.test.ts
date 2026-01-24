import DatabaseManager from '../database/DatabaseManager';
import { Articulo } from '../database/DatabaseManager';

// Mock DatabaseManager for testing
jest.mock('../database/DatabaseManager');

describe('DatabaseManager', () => {
  const mockArticulo: Articulo = {
    id: 1,
    nombre: 'Test Product',
    descripcion: 'Test Description',
    precio: 100,
    cantidad: 5,
    imagen: 'file://test.jpg',
    numeroBodega: 'B123456789',
    observaciones: 'Test Notes',
    fechaIngreso: '23/01/2026',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('insertarArticulo', () => {
    it('should insert an article successfully', async () => {
      const mockInsertarArticulo = DatabaseManager.insertarArticulo as jest.MockedFunction<typeof DatabaseManager.insertarArticulo>;
      mockInsertarArticulo.mockResolvedValue(1);

      const result = await DatabaseManager.insertarArticulo(mockArticulo);

      expect(result).toBe(1);
      expect(mockInsertarArticulo).toHaveBeenCalledWith(mockArticulo);
    });

    it('should handle insert errors', async () => {
      const mockInsertarArticulo = DatabaseManager.insertarArticulo as jest.MockedFunction<typeof DatabaseManager.insertarArticulo>;
      mockInsertarArticulo.mockRejectedValue(new Error('Database error'));

      await expect(DatabaseManager.insertarArticulo(mockArticulo)).rejects.toThrow('Database error');
    });
  });

  describe('obtenerArticulos', () => {
    it('should get all articles', async () => {
      const mockObtenerArticulos = DatabaseManager.obtenerArticulos as jest.MockedFunction<typeof DatabaseManager.obtenerArticulos>;
      mockObtenerArticulos.mockResolvedValue([mockArticulo]);

      const result = await DatabaseManager.obtenerArticulos();

      expect(result).toEqual([mockArticulo]);
      expect(mockObtenerArticulos).toHaveBeenCalled();
    });
  });

  describe('contarArticulos', () => {
    it('should count articles', async () => {
      const mockContarArticulos = DatabaseManager.contarArticulos as jest.MockedFunction<typeof DatabaseManager.contarArticulos>;
      mockContarArticulos.mockResolvedValue(5);

      const result = await DatabaseManager.contarArticulos();

      expect(result).toBe(5);
    });
  });

  describe('eliminarArticulo', () => {
    it('should delete an article', async () => {
      const mockEliminarArticulo = DatabaseManager.eliminarArticulo as jest.MockedFunction<typeof DatabaseManager.eliminarArticulo>;
      mockEliminarArticulo.mockResolvedValue();

      await DatabaseManager.eliminarArticulo(1);

      expect(mockEliminarArticulo).toHaveBeenCalledWith(1);
    });
  });
});