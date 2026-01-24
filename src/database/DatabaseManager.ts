import * as SQLite from 'expo-sqlite';
import Logger from '../utils/Logger';
import ImageService from '../services/ImageService';

export interface Articulo {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  numeroBodega: string;
  observaciones?: string;
  fechaIngreso: string;
  fechaModificacion?: string;
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mi_inventario.db');
      await this.createTables();
    } catch (error) {
      Logger.error('Error al inicializar base de datos', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    // Crear tabla de artículos (Ahora Productos)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS articulos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio INTEGER DEFAULT 0,
        cantidad INTEGER DEFAULT 1,
        imagen TEXT,
        numeroBodega TEXT NOT NULL UNIQUE,
        observaciones TEXT,
        fechaIngreso TEXT NOT NULL,
        fechaModificacion DATETIME
      );
    `);

    // Crear índices
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_nombre ON articulos(nombre);
      CREATE INDEX IF NOT EXISTS idx_numeroBodega ON articulos(numeroBodega);
    `);
  }

  // ============================================
  // CRUD ARTÍCULOS
  // ============================================

  async insertarArticulo(articulo: Omit<Articulo, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const result = await this.db.runAsync(
        `INSERT INTO articulos (
          nombre, descripcion, precio, cantidad, imagen,
          numeroBodega, observaciones, fechaIngreso
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          articulo.nombre,
          articulo.descripcion,
          articulo.precio,
          articulo.cantidad,
          articulo.imagen || null,
          articulo.numeroBodega,
          articulo.observaciones || null,
          articulo.fechaIngreso
        ]
      );

      if (result.lastInsertRowId === undefined) {
        throw new Error('No se pudo obtener el ID del artículo insertado');
      }
      return result.lastInsertRowId;
    } catch (error) {
      Logger.error('Error al insertar artículo', error);
      throw error;
    }
  }

  async obtenerArticulos(): Promise<Articulo[]> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const articulos = await this.db.getAllAsync<Articulo>(
        'SELECT * FROM articulos ORDER BY fechaIngreso DESC'
      );
      return articulos;
    } catch (error) {
      Logger.error('Error al obtener artículos', error);
      throw error;
    }
  }

  async contarArticulos(): Promise<number> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM articulos'
      );
      return result?.count || 0;
    } catch (error) {
      Logger.error('Error al contar artículos', error);
      return 0;
    }
  }

  async buscarArticulos(termino: string): Promise<Articulo[]> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const articulos = await this.db.getAllAsync<Articulo>(
        `SELECT * FROM articulos 
         WHERE nombre LIKE ? OR numeroBodega LIKE ? 
         ORDER BY fechaIngreso DESC`,
        [`%${termino}%`, `%${termino}%`]
      );
      return articulos;
    } catch (error) {
      Logger.error('Error al buscar artículos', error);
      throw error;
    }
  }

  async actualizarArticulo(id: number, articulo: Partial<Articulo>): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const campos = [];
      const valores = [];

      if (articulo.nombre !== undefined) {
        campos.push('nombre = ?');
        valores.push(articulo.nombre);
      }
      if (articulo.descripcion !== undefined) {
        campos.push('descripcion = ?');
        valores.push(articulo.descripcion);
      }
      if (articulo.precio !== undefined) {
        campos.push('precio = ?');
        valores.push(articulo.precio);
      }
      if (articulo.cantidad !== undefined) {
        campos.push('cantidad = ?');
        valores.push(articulo.cantidad);
      }
      if (articulo.imagen !== undefined) {
        campos.push('imagen = ?');
        valores.push(articulo.imagen);
      }
      if (articulo.numeroBodega !== undefined) {
        campos.push('numeroBodega = ?');
        valores.push(articulo.numeroBodega);
      }
      if (articulo.observaciones !== undefined) {
        campos.push('observaciones = ?');
        valores.push(articulo.observaciones);
      }

      campos.push('fechaModificacion = CURRENT_TIMESTAMP');
      valores.push(id);

      await this.db.runAsync(
        `UPDATE articulos SET ${campos.join(', ')} WHERE id = ?`,
        valores
      );

    } catch (error) {
      Logger.error('Error al actualizar artículo', error);
      throw error;
    }
  }



  async eliminarArticulo(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      // 1. Obtener la imagen antes de borrar
      const registro = await this.db.getFirstAsync<{ imagen: string | null }>(
        'SELECT imagen FROM articulos WHERE id = ?',
        [id]
      );

      // 2. Borrar archivo físico si existe
      if (registro?.imagen) {
        await ImageService.deleteImage(registro.imagen);
      }

      // 3. Borrar de la BD
      await this.db.runAsync('DELETE FROM articulos WHERE id = ?', [id]);
    } catch (error) {
      Logger.error('Error al eliminar artículo', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      // Clear images and database in parallel (independent operations)
      await Promise.all([
        ImageService.clearAllImages(),
        this.db.runAsync('DELETE FROM articulos')
      ]);
    } catch (error) {
      Logger.error('Error al resetear base de datos', error);
      throw error;
    }
  }
}

export default new DatabaseManager();