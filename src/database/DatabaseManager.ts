import * as SQLite from 'expo-sqlite';

export interface Articulo {
  id?: number;
  rut: string;
  nombreCliente: string;
  telefono?: string;
  tipoArticulo: string;
  descripcion: string;
  numeroBodega: string;
  observaciones?: string;
  estado: 'En Bodega' | 'Entregado';
  fechaIngreso: string;
  fechaEntrega?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface Abono {
  id?: number;
  articuloId: number;
  monto: number;
  metodoPago: string;
  fecha: string;
  observaciones?: string;
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('napoli.db');
      await this.createTables();
      console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar base de datos:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    // Crear tabla de artículos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS articulos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rut TEXT NOT NULL,
        nombreCliente TEXT NOT NULL,
        telefono TEXT,
        tipoArticulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        numeroBodega TEXT NOT NULL UNIQUE,
        observaciones TEXT,
        estado TEXT DEFAULT 'En Bodega' CHECK(estado IN ('En Bodega', 'Entregado')),
        fechaIngreso TEXT NOT NULL,
        fechaEntrega TEXT,
        fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fechaModificacion DATETIME
      );
    `);

    // Crear índices para artículos
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_rut ON articulos(rut);
      CREATE INDEX IF NOT EXISTS idx_estado ON articulos(estado);
      CREATE INDEX IF NOT EXISTS idx_numeroBodega ON articulos(numeroBodega);
      CREATE INDEX IF NOT EXISTS idx_fechaIngreso ON articulos(fechaIngreso);
    `);

    // Crear tabla de abonos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS abonos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        articuloId INTEGER NOT NULL,
        monto REAL NOT NULL,
        metodoPago TEXT DEFAULT 'Efectivo',
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        observaciones TEXT,
        FOREIGN KEY (articuloId) REFERENCES articulos(id) ON DELETE CASCADE
      );
    `);

    // Crear índices para abonos
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_articuloId ON abonos(articuloId);
      CREATE INDEX IF NOT EXISTS idx_fechaAbono ON abonos(fecha);
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
          rut, nombreCliente, telefono, tipoArticulo, descripcion, 
          numeroBodega, observaciones, estado, fechaIngreso, fechaEntrega
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          articulo.rut,
          articulo.nombreCliente,
          articulo.telefono || null,
          articulo.tipoArticulo,
          articulo.descripcion,
          articulo.numeroBodega,
          articulo.observaciones || null,
          articulo.estado,
          articulo.fechaIngreso,
          articulo.fechaEntrega || null
        ]
      );

      console.log('✅ Artículo insertado con ID:', result.lastInsertRowId);
      return result.lastInsertRowId!;
    } catch (error) {
      console.error('❌ Error al insertar artículo:', error);
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
      console.error('❌ Error al obtener artículos:', error);
      throw error;
    }
  }

  async buscarArticulos(termino: string): Promise<Articulo[]> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const articulos = await this.db.getAllAsync<Articulo>(
        `SELECT * FROM articulos 
         WHERE rut LIKE ? OR nombreCliente LIKE ? OR numeroBodega LIKE ? 
         ORDER BY fechaIngreso DESC`,
        [`%${termino}%`, `%${termino}%`, `%${termino}%`]
      );
      return articulos;
    } catch (error) {
      console.error('❌ Error al buscar artículos:', error);
      throw error;
    }
  }

  async actualizarArticulo(id: number, articulo: Partial<Articulo>): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const campos = [];
      const valores = [];

      if (articulo.rut !== undefined) {
        campos.push('rut = ?');
        valores.push(articulo.rut);
      }
      if (articulo.nombreCliente !== undefined) {
        campos.push('nombreCliente = ?');
        valores.push(articulo.nombreCliente);
      }
      if (articulo.telefono !== undefined) {
        campos.push('telefono = ?');
        valores.push(articulo.telefono);
      }
      if (articulo.tipoArticulo !== undefined) {
        campos.push('tipoArticulo = ?');
        valores.push(articulo.tipoArticulo);
      }
      if (articulo.descripcion !== undefined) {
        campos.push('descripcion = ?');
        valores.push(articulo.descripcion);
      }
      if (articulo.numeroBodega !== undefined) {
        campos.push('numeroBodega = ?');
        valores.push(articulo.numeroBodega);
      }
      if (articulo.observaciones !== undefined) {
        campos.push('observaciones = ?');
        valores.push(articulo.observaciones);
      }
      if (articulo.estado !== undefined) {
        campos.push('estado = ?');
        valores.push(articulo.estado);
      }
      if (articulo.fechaEntrega !== undefined) {
        campos.push('fechaEntrega = ?');
        valores.push(articulo.fechaEntrega);
      }

      campos.push('fechaModificacion = CURRENT_TIMESTAMP');
      valores.push(id);

      await this.db.runAsync(
        `UPDATE articulos SET ${campos.join(', ')} WHERE id = ?`,
        valores
      );

      console.log('✅ Artículo actualizado correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar artículo:', error);
      throw error;
    }
  }

  async eliminarArticulo(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      await this.db.runAsync('DELETE FROM articulos WHERE id = ?', [id]);
      console.log('✅ Artículo eliminado correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar artículo:', error);
      throw error;
    }
  }

  // ============================================
  // CRUD ABONOS
  // ============================================

  async insertarAbono(abono: Omit<Abono, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const result = await this.db.runAsync(
        `INSERT INTO abonos (articuloId, monto, metodoPago, fecha, observaciones)
         VALUES (?, ?, ?, ?, ?)`,
        [
          abono.articuloId,
          abono.monto,
          abono.metodoPago,
          abono.fecha,
          abono.observaciones || null
        ]
      );

      console.log('✅ Abono insertado con ID:', result.lastInsertRowId);
      return result.lastInsertRowId!;
    } catch (error) {
      console.error('❌ Error al insertar abono:', error);
      throw error;
    }
  }

  async obtenerAbonosPorArticulo(articuloId: number): Promise<Abono[]> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const abonos = await this.db.getAllAsync<Abono>(
        'SELECT * FROM abonos WHERE articuloId = ? ORDER BY fecha DESC',
        [articuloId]
      );
      return abonos;
    } catch (error) {
      console.error('❌ Error al obtener abonos:', error);
      throw error;
    }
  }

  async obtenerTotalAbonos(articuloId: number): Promise<number> {
    if (!this.db) throw new Error('Base de datos no inicializada');

    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(monto), 0) as total FROM abonos WHERE articuloId = ?',
        [articuloId]
      );
      return result?.total || 0;
    } catch (error) {
      console.error('❌ Error al obtener total de abonos:', error);
      throw error;
    }
  }
}

export default new DatabaseManager();