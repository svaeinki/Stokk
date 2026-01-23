import * as FileSystem from 'expo-file-system/legacy';
import Logger from '../utils/Logger';

const IMAGES_DIR = (FileSystem.documentDirectory || '') + 'images/';

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

    // Guardar imagen desde una URI temporal a permanente
    async saveImage(tempUri: string): Promise<string | null> {
        try {
            await this.initialized;

            const fileName = tempUri.split('/').pop() || `image_${Date.now()}.jpg`;
            const newPath = IMAGES_DIR + fileName;

            // Si la imagen ya está en el directorio correcto, no hacer nada
            if (tempUri.startsWith(IMAGES_DIR)) {
                return tempUri;
            }

            await FileSystem.copyAsync({
                from: tempUri,
                to: newPath,
            });

            Logger.info('Imagen guardada en:', newPath);
            return newPath; // IMPORTANTE: Devolver la URI del sistema de archivos, no la temporal
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
