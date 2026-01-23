import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  Text,
  Divider
} from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import Logger from '../utils/Logger';
import {
  generarNumeroBodega,
  validarFormularioArticulo
} from '../utils/Validation';
import SubscriptionService from '../services/SubscriptionService';
import { useTheme } from '../context/ThemeContext';
import { TabParamList, IngresarScreenNavigationProp } from '../types/navigation';
import { FREE_TIER_PRODUCT_LIMIT } from '../constants/app';
import ImageService from '../services/ImageService';

type IngresarRouteProp = RouteProp<TabParamList, 'Ingresar'>;

const ArticuloForm: React.FC = () => {
  const route = useRoute<IngresarRouteProp>();
  const navigation = useNavigation<IngresarScreenNavigationProp>();
  const articulo = route.params?.articulo;
  const { theme } = useTheme();
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

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (articulo) {
      setFormData(articulo);
    } else {
      setFormData(prev => ({
        ...prev,
        numeroBodega: generarNumeroBodega()
      }));
      checkLimit();
    }
  }, [articulo]);

  const checkLimit = async () => {
    try {
      const count = await DatabaseManager.contarArticulos();
      const isPro = await SubscriptionService.isPro();

      // Límite gratuito: 20 artículos
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
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const showPermissionDeniedAlert = (tipo: 'camera' | 'gallery') => {
    Alert.alert(
      t('permissions.required_title'),
      t('permissions.required_msg', { type: t(`permissions.${tipo}`) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('permissions.open_settings'), onPress: openSettings }
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      showPermissionDeniedAlert('camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, imagen: result.assets[0].uri }));
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showPermissionDeniedAlert('gallery');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, imagen: result.assets[0].uri }));
    }
  };

  const pickImage = () => {
    Alert.alert(
      t('permissions.select_image_title'),
      t('permissions.select_image_msg'),
      [
        { text: t('permissions.take_photo'), onPress: takePhoto },
        { text: t('permissions.pick_gallery'), onPress: pickFromGallery },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
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
      if (formData.imagen && formData.imagen !== articulo?.imagen) {
        // Si hay una imagen nueva o cambió, guardarla permanentemente
        const savedUri = await ImageService.saveImage(formData.imagen);
        if (savedUri) {
          finalImageUri = savedUri;
        }

        // Si estamos editando y había una imagen anterior diferente, borrar la vieja
        if (articulo?.imagen && articulo.imagen !== formData.imagen) {
          await ImageService.deleteImage(articulo.imagen);
        }
      } else if (!formData.imagen && articulo?.imagen) {
        // Si se eliminó la imagen en la edición, borrar el archivo anterior
        await ImageService.deleteImage(articulo.imagen);
      }

      const articuloAGuardar = {
        ...formData,
        imagen: finalImageUri,
      };

      // 2. Guardado en Base de Datos
      if (articulo?.id) {
        await DatabaseManager.actualizarArticulo(articulo.id, articuloAGuardar);
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

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    props: any = {}
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
        mode="outlined"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        {...props}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {articulo ? t('product.edit_title') : t('product.new_title')}
          </Text>

          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={[styles.imageContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant }]}>
              {formData.imagen ? (
                <Image source={{ uri: formData.imagen }} style={styles.image} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="add-a-photo" size={40} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>{t('product.add_photo')}</Text>
                </View>
              )}
            </TouchableOpacity>
            {formData.imagen && (
              <Button mode="text" onPress={() => setFormData(prev => ({ ...prev, imagen: '' }))} textColor={theme.colors.error}>
                {t('product.delete_photo')}
              </Button>
            )}
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('product.section_data')}</Text>

            {renderField(
              t('product.name_label'),
              formData.nombre || '',
              (text) => setFormData(prev => ({ ...prev, nombre: text })),
              { placeholder: t('product.placeholder_name') }
            )}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderField(
                  t('product.price_label'),
                  formData.precio?.toString() || '',
                  (text) => setFormData(prev => ({ ...prev, precio: parseInt(text) || 0 })),
                  {
                    placeholder: '0',
                    keyboardType: 'numeric',
                    left: <TextInput.Affix text="$" />
                  }
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                {renderField(
                  t('product.quantity_label'),
                  formData.cantidad?.toString() || '',
                  (text) => setFormData(prev => ({ ...prev, cantidad: parseInt(text) || 0 })),
                  {
                    placeholder: '1',
                    keyboardType: 'numeric'
                  }
                )}
              </View>
            </View>

            {renderField(
              t('product.description_label'),
              formData.descripcion || '',
              (text) => setFormData(prev => ({ ...prev, descripcion: text })),
              {
                placeholder: t('product.placeholder_desc'),
                multiline: true,
                numberOfLines: 3,
                style: [styles.textArea, { backgroundColor: theme.colors.surface }]
              }
            )}

            {renderField(
              t('product.location_label'),
              formData.numeroBodega || '',
              (text) => setFormData(prev => ({ ...prev, numeroBodega: text })),
              {
                placeholder: 'B123456789',
                disabled: !!articulo,
                right: (
                  <TextInput.Icon
                    icon="refresh"
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      numeroBodega: generarNumeroBodega()
                    }))}
                  />
                )
              }
            )}
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('product.section_notes')}</Text>

            {renderField(
              t('product.notes_label'),
              formData.observaciones || '',
              (text) => setFormData(prev => ({ ...prev, observaciones: text })),
              {
                placeholder: t('product.placeholder_notes'),
                multiline: true,
                numberOfLines: 2,
              }
            )}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Inventario')}
          style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
          textColor={theme.colors.onSurface}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>

        <Button
          mode="contained"
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          loading={loading}
          disabled={loading}
        >
          {articulo ? t('common.update') : t('common.save')}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    // Background handled by theme
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default ArticuloForm;