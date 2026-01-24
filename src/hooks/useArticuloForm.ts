import { useState, useEffect } from 'react';
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
}

export const useArticuloForm = ({ 
  initialArticulo, 
  isEditing = false 
}: UseArticuloFormProps) => {
  const navigation = useNavigation<IngresarScreenNavigationProp>();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Partial<Articulo>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    cantidad: 1,
    imagen: '',
    numeroBodega: '',
    observaciones: '',
    fechaIngreso: new Date().toLocaleDateString('es-CL'),
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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
  }, [initialArticulo]);

  const checkLimit = async () => {
    try {
      const count = await DatabaseManager.contarArticulos();
      const isPro = await SubscriptionService.isPro();

      if (count >= FREE_TIER_PRODUCT_LIMIT && !isPro) {
        Alert.alert(
          t('limit.title'),
          t('limit.message', { limit: FREE_TIER_PRODUCT_LIMIT }),
          [
            { text: t('common.cancel'), onPress: () => navigation.goBack(), style: 'cancel' },
            { text: t('limit.view_plans'), onPress: () => navigation.navigate('Paywall' as any) }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      Logger.error('Error verificando límites', error);
    }
  };

  const handleFieldChange = (field: keyof Articulo, value: string | number) => {
    setFormData((prev: Partial<Articulo>) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const validation = validarFormularioArticulo(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert(t('product.validation_error'), validation.errors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      let finalImageUri = formData.imagen;

      // 1. Manejo de persistencia de imagen
      if (formData.imagen && formData.imagen !== initialArticulo?.imagen) {
        const savedUri = await ImageService.saveImage(formData.imagen);
        if (savedUri) {
          finalImageUri = savedUri;
        }

        if (initialArticulo?.imagen && initialArticulo.imagen !== formData.imagen) {
          await ImageService.deleteImage(initialArticulo.imagen);
        }
      } else if (!formData.imagen && initialArticulo?.imagen) {
        await ImageService.deleteImage(initialArticulo.imagen);
      }

      const articuloAGuardar = {
        ...formData,
        imagen: finalImageUri,
      };

      // 2. Guardado en Base de Datos
      if (initialArticulo?.id) {
        await DatabaseManager.actualizarArticulo(initialArticulo.id, articuloAGuardar);
        Alert.alert(t('common.success'), t('product.updated_success'), [
          { text: t('common.ok'), onPress: () => navigation.navigate('Inventario') }
        ]);
      } else {
        await DatabaseManager.insertarArticulo(articuloAGuardar as Omit<Articulo, 'id'>);
        Alert.alert(t('common.success'), t('product.created_success'), [
          { text: t('common.ok'), onPress: () => navigation.navigate('Inventario') }
        ]);
      }
    } catch (error) {
      Logger.error('Error al guardar', error);
      Alert.alert(t('common.error'), t('product.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('Inventario');
  };

  return {
    formData,
    loading,
    errors,
    handleFieldChange,
    handleSave,
    handleCancel,
  };
};