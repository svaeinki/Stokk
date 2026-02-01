import { useCallback, useRef, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Articulo } from '../database/DatabaseManager';
import DatabaseManager from '../database/DatabaseManager';
import ImageService from '../services/ImageService';
import { validarFormularioArticulo } from '../utils/Validation';
import Logger from '../utils/Logger';
import { IngresarScreenNavigationProp } from '../types/navigation';

interface UseArticuloSubmitOptions {
  initialArticulo?: Articulo;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useArticuloSubmit = (options: UseArticuloSubmitOptions = {}) => {
  const { initialArticulo, onSuccess, onError } = options;
  const navigation = useNavigation<IngresarScreenNavigationProp>();
  const { t } = useTranslation();
  const isMountedRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSave = useCallback(
    async (formData: Partial<Articulo>) => {
      const validation = validarFormularioArticulo(formData);

      if (!validation.isValid) {
        setErrors(validation.errors);
        if (onError) {
          onError(validation.errors.join('\n'));
        } else {
          Alert.alert(
            t('product.validation_error'),
            validation.errors.join('\n')
          );
        }
        return false;
      }

      try {
        setLoading(true);
        const finalImageUri = formData.imagen;

        const articuloAGuardar = {
          ...formData,
          imagen: finalImageUri,
        };

        let savedId: number | undefined;
        if (initialArticulo?.id) {
          await DatabaseManager.actualizarArticulo(
            initialArticulo.id,
            articuloAGuardar
          );
          savedId = initialArticulo.id;
        } else {
          savedId = await DatabaseManager.insertarArticulo(
            articuloAGuardar as Omit<Articulo, 'id'>
          );
        }

        // Handle image persistence
        if (formData.imagen && formData.imagen !== initialArticulo?.imagen) {
          const savedUri = await ImageService.saveImage(formData.imagen);
          if (savedUri && savedId) {
            await DatabaseManager.actualizarArticulo(savedId, {
              imagen: savedUri,
            });
          }

          if (
            initialArticulo?.imagen &&
            initialArticulo.imagen !== formData.imagen
          ) {
            try {
              await ImageService.deleteImage(initialArticulo.imagen);
            } catch {
              Logger.warn('No se pudo eliminar imagen anterior');
            }
          }
        } else if (!formData.imagen && initialArticulo?.imagen) {
          try {
            await ImageService.deleteImage(initialArticulo.imagen);
            if (savedId) {
              await DatabaseManager.actualizarArticulo(savedId, { imagen: '' });
            }
          } catch {
            Logger.warn('No se pudo eliminar imagen');
          }
        }

        if (!isMountedRef.current) return true;

        const successMessage = initialArticulo?.id
          ? t('product.updated_success')
          : t('product.created_success');

        if (onSuccess) {
          onSuccess(successMessage);
          navigation.navigate('Inventario');
        } else {
          Alert.alert(t('common.success'), successMessage, [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Inventario'),
            },
          ]);
        }
        return true;
      } catch (error) {
        Logger.error('Error al guardar', error);
        if (!isMountedRef.current) return false;

        if (onError) {
          onError(t('product.save_error'));
        } else {
          Alert.alert(t('common.error'), t('product.save_error'));
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [initialArticulo, navigation, t, onSuccess, onError]
  );

  const handleCancel = useCallback(() => {
    navigation.navigate('Inventario');
  }, [navigation]);

  return {
    loading,
    errors,
    handleSave,
    handleCancel,
  };
};
