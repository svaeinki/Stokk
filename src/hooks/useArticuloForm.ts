import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Articulo } from '../database/DatabaseManager';
import DatabaseManager from '../database/DatabaseManager';
import ImageService from '../services/ImageService';
import SubscriptionService from '../services/SubscriptionService';
import { generarNumeroBodega, validarFormularioArticulo } from '../utils/Validation';
import Logger from '../utils/Logger';
import { FREE_TIER_PRODUCT_LIMIT } from '../constants/app';
import { IngresarScreenNavigationProp } from '../types/navigation';

interface UseArticuloFormProps {
  initialArticulo?: Articulo;
  isEditing?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useArticuloForm = ({
  initialArticulo,
  isEditing = false,
  onSuccess,
  onError,
}: UseArticuloFormProps) => {
  const navigation = useNavigation<IngresarScreenNavigationProp>();
  const { t } = useTranslation();

  // Ref para prevenir memory leaks en operaciones async
  const isMountedRef = useRef(true);

  const [formData, setFormData] = useState<Partial<Articulo>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    cantidad: 1,
    imagen: '',
    numeroBodega: '',
    observaciones: '',
    fechaIngreso: new Date().toISOString(),
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkLimit = useCallback(async () => {
    try {
      // Fetch count and subscription status in parallel
      const [count, isPro] = await Promise.all([
        DatabaseManager.contarArticulos(),
        SubscriptionService.isPro()
      ]);

      // Verificar si el componente sigue montado
      if (!isMountedRef.current) return;

      if (count >= FREE_TIER_PRODUCT_LIMIT && !isPro) {
        Alert.alert(
          t('limit.title'),
          t('limit.message', { limit: FREE_TIER_PRODUCT_LIMIT }),
          [
            { text: t('common.cancel'), onPress: () => navigation.goBack(), style: 'cancel' },
            { text: t('limit.view_plans'), onPress: () => navigation.navigate('Paywall') }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      Logger.error('Error verificando límites', error);
      // Mostrar error al usuario si hay callback
      if (isMountedRef.current && onError) {
        onError(t('list.error_loading'));
      }
    }
  }, [t, navigation, onError]);

  useEffect(() => {
    if (initialArticulo) {
      setFormData(initialArticulo);
    } else {
      setFormData((prev: Partial<Articulo>) => ({
        ...prev,
        numeroBodega: generarNumeroBodega()
      }));
      checkLimit();
    }
  }, [initialArticulo, checkLimit]);

  const handleFieldChange = useCallback((field: keyof Articulo, value: string | number) => {
    setFormData((prev: Partial<Articulo>) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const validation = validarFormularioArticulo(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      if (onError) {
        onError(validation.errors.join('\n'));
      } else {
        Alert.alert(t('product.validation_error'), validation.errors.join('\n'));
      }
      return;
    }

    try {
      setLoading(true);
      let finalImageUri = formData.imagen;

      // 1. Guardar en Base de Datos primero (operación crítica)
      const articuloAGuardar = {
        ...formData,
        imagen: finalImageUri, // Usar URI temporal primero
      };

      let savedId: number | undefined;
      if (initialArticulo?.id) {
        await DatabaseManager.actualizarArticulo(initialArticulo.id, articuloAGuardar);
        savedId = initialArticulo.id;
      } else {
        savedId = await DatabaseManager.insertarArticulo(articuloAGuardar as Omit<Articulo, 'id'>);
      }

      // 2. Manejo de persistencia de imagen (después del guardado en BD)
      if (formData.imagen && formData.imagen !== initialArticulo?.imagen) {
        const savedUri = await ImageService.saveImage(formData.imagen);
        if (savedUri && savedId) {
          // Actualizar la URI de imagen en la BD
          await DatabaseManager.actualizarArticulo(savedId, { imagen: savedUri });
        }

        // Eliminar imagen anterior si había una diferente
        if (initialArticulo?.imagen && initialArticulo.imagen !== formData.imagen) {
          try {
            await ImageService.deleteImage(initialArticulo.imagen);
          } catch {
            // No fallar si no se puede eliminar imagen antigua
            Logger.warn('No se pudo eliminar imagen anterior');
          }
        }
      } else if (!formData.imagen && initialArticulo?.imagen) {
        // Se eliminó la imagen
        try {
          await ImageService.deleteImage(initialArticulo.imagen);
          if (savedId) {
            await DatabaseManager.actualizarArticulo(savedId, { imagen: '' });
          }
        } catch {
          Logger.warn('No se pudo eliminar imagen');
        }
      }

      // Verificar si el componente sigue montado antes de actualizar estado
      if (!isMountedRef.current) return;

      const successMessage = initialArticulo?.id
        ? t('product.updated_success')
        : t('product.created_success');

      if (onSuccess) {
        onSuccess(successMessage);
        navigation.navigate('Inventario');
      } else {
        Alert.alert(t('common.success'), successMessage, [
          { text: t('common.ok'), onPress: () => navigation.navigate('Inventario') }
        ]);
      }
    } catch (error) {
      Logger.error('Error al guardar', error);
      if (!isMountedRef.current) return;

      if (onError) {
        onError(t('product.save_error'));
      } else {
        Alert.alert(t('common.error'), t('product.save_error'));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [formData, initialArticulo, navigation, t, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    navigation.navigate('Inventario');
  }, [navigation]);

  return {
    formData,
    loading,
    errors,
    handleFieldChange,
    handleSave,
    handleCancel,
  };
};
