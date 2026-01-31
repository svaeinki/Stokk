import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import Logger from '../utils/Logger';

const IMAGES_DIR = Paths.document.uri + 'images/';

// Configuración de compresión
const IMAGE_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8, // 80% calidad JPEG
};

class ImageService {
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.ensureDirExists();
  }

  // Asegurar que el directorio de imágenes exista
  private async ensureDirExists(): Promise<void> {
    const dir = new Directory(IMAGES_DIR);
    if (!dir.exists) {
      Logger.info('Creando directorio de imágenes...');
      await dir.create();
    }
  }

  // Comprimir imagen antes de guardar
  private async compressImage(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: IMAGE_CONFIG.maxWidth,
              height: IMAGE_CONFIG.maxHeight,
            },
          },
        ],
        {
          compress: IMAGE_CONFIG.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      Logger.debug('Imagen comprimida:', result.uri);
      return result.uri;
    } catch (error) {
      Logger.warn('No se pudo comprimir imagen, usando original', error);
      return uri; // Fallback a la imagen original
    }
  }

  // Guardar imagen desde una URI temporal a permanente (con compresión)
  async saveImage(tempUri: string): Promise<string | null> {
    try {
      await this.initialized;

      // Si la imagen ya está en el directorio correcto, no hacer nada
      if (tempUri.startsWith(IMAGES_DIR)) {
        return tempUri;
      }

      // Comprimir imagen antes de guardar
      const compressedUri = await this.compressImage(tempUri);

      const fileName = `image_${Date.now()}.jpg`;
      const newPath = IMAGES_DIR + fileName;

      const sourceFile = new File(compressedUri);
      const destFile = new File(newPath);
      await sourceFile.copy(destFile);

      // Limpiar archivo temporal de compresión si es diferente del original
      if (compressedUri !== tempUri && compressedUri.startsWith('file://')) {
        try {
          const tempFile = new File(compressedUri);
          await tempFile.delete();
        } catch {
          // Ignorar errores de limpieza
        }
      }

      Logger.info('Imagen guardada en:', newPath);
      return newPath;
    } catch (error) {
      Logger.error('Error al guardar imagen', error);
      return null;
    }
  }

  // Eliminar imagen del sistema de archivos
  async deleteImage(uri: string): Promise<void> {
    try {
      // Solo intentar borrar si es una imagen local nuestra
      if (!uri.startsWith('file://')) return;

      const file = new File(uri);
      if (file.exists) {
        await file.delete();
        Logger.info('Imagen eliminada:', uri);
      }
    } catch (error) {
      Logger.error('Error al eliminar imagen', error);
    }
  }

  // Limpiar todo el directorio (útil para reset)
  async clearAllImages(): Promise<void> {
    try {
      const dir = new Directory(IMAGES_DIR);
      if (dir.exists) {
        await dir.delete();
        await this.ensureDirExists();
      }
    } catch (error) {
      Logger.error('Error al limpiar directorio de imágenes', error);
    }
  }
}

export default new ImageService();
