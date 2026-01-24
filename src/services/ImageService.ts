import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import Logger from '../utils/Logger';

const IMAGES_DIR = (FileSystem.documentDirectory || '') + 'images/';

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
        const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
        if (!dirInfo.exists) {
            Logger.info('Creando directorio de imágenes...');
            await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
        }
    }

    // Comprimir imagen antes de guardar
    private async compressImage(uri: string): Promise<string> {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: IMAGE_CONFIG.maxWidth, height: IMAGE_CONFIG.maxHeight } }],
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

            await FileSystem.copyAsync({
                from: compressedUri,
                to: newPath,
            });

            // Limpiar archivo temporal de compresión si es diferente del original
            if (compressedUri !== tempUri && compressedUri.startsWith('file://')) {
                try {
                    await FileSystem.deleteAsync(compressedUri, { idempotent: true });
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

            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(uri);
                Logger.info('Imagen eliminada:', uri);
            }
        } catch (error) {
            Logger.error('Error al eliminar imagen', error);
        }
    }

    // Limpiar todo el directorio (útil para reset)
    async clearAllImages(): Promise<void> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
            if (dirInfo.exists) {
                await FileSystem.deleteAsync(IMAGES_DIR);
                await this.ensureDirExists();
            }
        } catch (error) {
            Logger.error('Error al limpiar directorio de imágenes', error);
        }
    }
}

export default new ImageService();
