import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity
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
import { StackNavigationProp } from '@react-navigation/stack';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import {
  generarNumeroBodega,
  validarFormularioArticulo
} from '../utils/Validation';
import SubscriptionService from '../services/SubscriptionService';
import { useTheme } from '../context/ThemeContext';

interface RouteParams {
  articulo?: Articulo;
}

type ArticuloFormRouteProp = RouteProp<{ ArticuloForm: RouteParams }, 'ArticuloForm'>;
type ArticuloFormNavigationProp = StackNavigationProp<{ ArticuloForm: RouteParams }, 'ArticuloForm'>;

const ArticuloForm: React.FC = () => {
  const route = useRoute<ArticuloFormRouteProp>();
  const navigation = useNavigation<ArticuloFormNavigationProp>();
  const articulo = route.params?.articulo;
  const { theme } = useTheme();

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
      if (count >= 20 && !isPro) {
        Alert.alert(
          'Límite Alcanzado',
          'Has llegado al límite de 20 productos de la versión gratuita. \n\n¡Actualiza a PRO para tener almacenamiento ilimitado!',
          [
            { text: 'Cancelar', onPress: () => navigation.goBack(), style: 'cancel' },
            { text: 'Ver Planes', onPress: () => navigation.navigate('Paywall' as never) }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error verificando límites:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos permiso para usar la cámara');
      return;
    }

    Alert.alert(
      'Seleccionar Imagen',
      '¿Qué deseas hacer?',
      [
        {
          text: 'Tomar Foto',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
            });

            if (!result.canceled) {
              setFormData(prev => ({ ...prev, imagen: result.assets[0].uri }));
            }
          }
        },
        {
          text: 'Galería',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
            });

            if (!result.canceled) {
              setFormData(prev => ({ ...prev, imagen: result.assets[0].uri }));
            }
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    const validation = validarFormularioArticulo(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Error de validación', validation.errors.join('\n'));
      return;
    }

    try {
      setLoading(true);

      if (articulo?.id) {
        await DatabaseManager.actualizarArticulo(articulo.id, formData);
        Alert.alert('Éxito', 'Producto actualizado correctamente', [
          { text: 'OK', onPress: () => navigation.navigate('Inventario' as never) }
        ]);
      } else {
        await DatabaseManager.insertarArticulo(formData as Omit<Articulo, 'id'>);
        Alert.alert('Éxito', 'Producto creado correctamente', [
          { text: 'OK', onPress: () => navigation.navigate('Inventario' as never) }
        ]);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
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
            {articulo ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>

          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={[styles.imageContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant }]}>
              {formData.imagen ? (
                <Image source={{ uri: formData.imagen }} style={styles.image} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="add-a-photo" size={40} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>Agregar Foto</Text>
                </View>
              )}
            </TouchableOpacity>
            {formData.imagen && (
              <Button mode="text" onPress={() => setFormData(prev => ({ ...prev, imagen: '' }))} textColor={theme.colors.error}>
                Eliminar Foto
              </Button>
            )}
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>📦 Datos del Producto</Text>

            {renderField(
              'Nombre del Producto *',
              formData.nombre || '',
              (text) => setFormData(prev => ({ ...prev, nombre: text })),
              { placeholder: 'Ej: Zapatillas Nike Air' }
            )}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderField(
                  'Precio *',
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
                  'Cantidad *',
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
              'Descripción',
              formData.descripcion || '',
              (text) => setFormData(prev => ({ ...prev, descripcion: text })),
              {
                placeholder: 'Detalles del producto...',
                multiline: true,
                numberOfLines: 3,
                style: [styles.textArea, { backgroundColor: theme.colors.surface }]
              }
            )}

            {renderField(
              'Ubicación / Código *',
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
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>📝 Notas Adicionales</Text>

            {renderField(
              'Observaciones',
              formData.observaciones || '',
              (text) => setFormData(prev => ({ ...prev, observaciones: text })),
              {
                placeholder: 'Notas internas...',
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
          onPress={() => navigation.navigate('Inventario' as never)}
          style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
          textColor={theme.colors.onSurface}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          mode="contained"
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          loading={loading}
          disabled={loading}
        >
          {articulo ? 'Actualizar' : 'Guardar'}
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