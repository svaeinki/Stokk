import { Articulo } from '../database/DatabaseManager';

const mockArticulo: Omit<Articulo, 'id'> = {
  nombre: 'Test Product',
  descripcion: 'Test Description',
  precio: 100,
  cantidad: 5,
  imagen: 'file://test.jpg',
  numeroBodega: 'Estante A3',
  observaciones: 'Test Notes',
  fechaIngreso: '23/01/2026',
};

// Store mock DB methods we can control per test
let mockExecAsync: jest.Mock;
let mockRunAsync: jest.Mock;
let mockGetAllAsync: jest.Mock;
let mockGetFirstAsync: jest.Mock;

// We need a fresh DatabaseManager for each test to avoid singleton state
let DatabaseManager: typeof import('../database/DatabaseManager').default;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  mockExecAsync = jest.fn().mockResolvedValue(undefined);
  mockRunAsync = jest
    .fn()
    .mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  mockGetAllAsync = jest.fn().mockResolvedValue([]);
  mockGetFirstAsync = jest.fn().mockResolvedValue(null);

  // Re-mock expo-sqlite with fresh mock functions BEFORE requiring DatabaseManager
  jest.doMock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
      execAsync: mockExecAsync,
      runAsync: mockRunAsync,
      getAllAsync: mockGetAllAsync,
      getFirstAsync: mockGetFirstAsync,
    }),
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DatabaseManager = require('../database/DatabaseManager').default;
});

describe('DatabaseManager', () => {
  describe('initDatabase', () => {
    it('should open database and create tables', async () => {
      await DatabaseManager.initDatabase();

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite');
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('mi_inventario.db');
      expect(mockExecAsync).toHaveBeenCalledTimes(2); // CREATE TABLE + CREATE INDEX
    });

    it('should not re-initialize if already initialized', async () => {
      await DatabaseManager.initDatabase();
      await DatabaseManager.initDatabase();

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite');
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent initialization calls', async () => {
      await Promise.all([
        DatabaseManager.initDatabase(),
        DatabaseManager.initDatabase(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite');
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('should allow retry after failed initialization', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite');
      (SQLite.openDatabaseAsync as jest.Mock).mockRejectedValueOnce(
        new Error('DB open failed')
      );

      await expect(DatabaseManager.initDatabase()).rejects.toThrow(
        'DB open failed'
      );

      // Second attempt should succeed (mock returns default resolved value)
      await DatabaseManager.initDatabase();
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('insertarArticulo', () => {
    it('should insert and return the new ID', async () => {
      await DatabaseManager.initDatabase();
      mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 42 });

      const id = await DatabaseManager.insertarArticulo(mockArticulo);

      expect(id).toBe(42);
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO articulos'),
        expect.arrayContaining([
          mockArticulo.nombre,
          mockArticulo.descripcion,
          mockArticulo.precio,
          mockArticulo.cantidad,
        ])
      );
    });

    it('should throw if lastInsertRowId is undefined', async () => {
      await DatabaseManager.initDatabase();
      mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: undefined });

      await expect(
        DatabaseManager.insertarArticulo(mockArticulo)
      ).rejects.toThrow('No se pudo obtener el ID');
    });

    it('should throw if database is not initialized', async () => {
      await expect(
        DatabaseManager.insertarArticulo(mockArticulo)
      ).rejects.toThrow('Base de datos no inicializada');
    });
  });

  describe('obtenerArticulos', () => {
    it('should return articles with default pagination', async () => {
      const expected = [{ ...mockArticulo, id: 1 }];
      await DatabaseManager.initDatabase();
      mockGetAllAsync.mockResolvedValueOnce(expected);

      const result = await DatabaseManager.obtenerArticulos();

      expect(result).toEqual(expected);
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM articulos'),
        [100, 0]
      );
    });

    it('should support custom limit and offset', async () => {
      await DatabaseManager.initDatabase();
      mockGetAllAsync.mockResolvedValueOnce([]);

      await DatabaseManager.obtenerArticulos(10, 20);

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        [10, 20]
      );
    });
  });

  describe('contarArticulos', () => {
    it('should return the count', async () => {
      await DatabaseManager.initDatabase();
      mockGetFirstAsync.mockResolvedValueOnce({ count: 5 });

      const count = await DatabaseManager.contarArticulos();

      expect(count).toBe(5);
    });

    it('should return 0 when result is null', async () => {
      await DatabaseManager.initDatabase();
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const count = await DatabaseManager.contarArticulos();

      expect(count).toBe(0);
    });
  });

  describe('buscarArticulos', () => {
    it('should search with LIKE pattern', async () => {
      await DatabaseManager.initDatabase();
      mockGetAllAsync.mockResolvedValueOnce([]);

      await DatabaseManager.buscarArticulos('test');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE nombre LIKE ?'),
        ['%test%', '%test%']
      );
    });
  });

  describe('actualizarArticulo', () => {
    it('should update specified fields', async () => {
      await DatabaseManager.initDatabase();

      await DatabaseManager.actualizarArticulo(1, {
        nombre: 'Updated',
        precio: 200,
      });

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE articulos SET'),
        expect.arrayContaining(['Updated', 200, 1])
      );
    });

    it('should always set fechaModificacion', async () => {
      await DatabaseManager.initDatabase();

      await DatabaseManager.actualizarArticulo(1, { nombre: 'Test' });

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('fechaModificacion = CURRENT_TIMESTAMP'),
        expect.any(Array)
      );
    });
  });

  describe('eliminarArticulo', () => {
    it('should delete the article by id', async () => {
      await DatabaseManager.initDatabase();
      mockGetFirstAsync.mockResolvedValueOnce({ imagen: null });

      await DatabaseManager.eliminarArticulo(1);

      expect(mockRunAsync).toHaveBeenCalledWith(
        'DELETE FROM articulos WHERE id = ?',
        [1]
      );
    });

    it('should query for image before deleting', async () => {
      await DatabaseManager.initDatabase();
      mockGetFirstAsync.mockResolvedValueOnce({
        imagen: 'file://test-image.jpg',
      });

      await DatabaseManager.eliminarArticulo(1);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT imagen FROM articulos WHERE id = ?',
        [1]
      );
      expect(mockRunAsync).toHaveBeenCalledWith(
        'DELETE FROM articulos WHERE id = ?',
        [1]
      );
    });
  });
});
