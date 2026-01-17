import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput as RNTextInput
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  Switch,
  HelperText,
  Divider
} from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import {
  validarRUTEnTiempoReal,
  formatearMoneda,
  generarNumeroBodega,
  validarFormularioArticulo
} from '../utils/Validation';

interface RouteParams {
  articulo?: Articulo;
}

type ArticuloFormRouteProp = RouteProp<{ ArticuloForm: RouteParams }, 'ArticuloForm'>;
type ArticuloFormNavigationProp = StackNavigationProp<{ ArticuloForm: RouteParams }, 'ArticuloForm'>;

const ArticuloForm: React.FC = () => {
  const route = useRoute<ArticuloFormRouteProp>();
  const navigation = useNavigation<ArticuloFormNavigationProp>();

  // CRITICAL FIX: Safely access params - may be undefined when navigated from tab
  const articulo = route.params?.articulo;

  const [formData, setFormData] = useState<Partial<Articulo>>({
    rut: '',
    nombreCliente: '',
    telefono: '',
    tipoArticulo: '',
    descripcion: '',
    numeroBodega: '',
    observaciones: '',
    estado: 'En Bodega',
    fechaIngreso: new Date().toLocaleDateString('es-CL'),
    fechaEntrega: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [rutValid, setRutValid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (articulo) {
      setFormData(articulo);
      setRutValid(validarRUTEnTiempoReal(articulo.rut).isValid);
    } else {
      setFormData(prev => ({
        ...prev,
        numeroBodega: generarNumeroBodega()
      }));
    }
  }, [articulo]);

  const handleRUTChange = (rut: string) => {
    const { isValid, formattedRUT } = validarRUTEnTiempoReal(rut);
    setFormData(prev => ({ ...prev, rut: formattedRUT }));
    setRutValid(isValid);
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
        // Editar artículo existente
        await DatabaseManager.actualizarArticulo(articulo.id, formData);
        Alert.alert('Éxito', 'Artículo actualizado correctamente');
      } else {
        // Crear nuevo artículo
        await DatabaseManager.insertarArticulo(formData as Omit<Articulo, 'id'>);
        Alert.alert('Éxito', 'Artículo creado correctamente');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar artículo:', error);
      Alert.alert('Error', 'No se pudo guardar el artículo');
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
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        mode="outlined"
        {...props}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>
            {articulo ? 'Editar Artículo' : 'Nuevo Artículo'}
          </Text>

          {/* Información del Cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Información del Cliente</Text>

            {renderField(
              'RUT *',
              formData.rut || '',
              handleRUTChange,
              {
                placeholder: '12.345.678-9',
                keyboardType: 'default',
                error: formData.rut ? !rutValid : false,
                right: (
                  <TextInput.Icon
                    icon={rutValid ? 'check-circle' : 'close-circle'}
                    color={rutValid ? '#4CAF50' : '#f44336'}
                  />
                )
              }
            )}
            <HelperText type="error" visible={formData.rut ? !rutValid : false}>
              RUT inválido
            </HelperText>

            {renderField(
              'Nombre Completo *',
              formData.nombreCliente || '',
              (text) => setFormData(prev => ({ ...prev, nombreCliente: text })),
              {
                placeholder: 'Juan Pérez'
              }
            )}

            {renderField(
              'Teléfono',
              formData.telefono || '',
              (text) => setFormData(prev => ({ ...prev, telefono: text })),
              {
                placeholder: '+56 9 1234 5678',
                keyboardType: 'phone-pad'
              }
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Información del Artículo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👞 Información del Artículo</Text>

            {renderField(
              'Tipo de Artículo *',
              formData.tipoArticulo || '',
              (text) => setFormData(prev => ({ ...prev, tipoArticulo: text })),
              {
                placeholder: 'Zapatos, Botas, Sandalias, etc.'
              }
            )}

            {renderField(
              'Descripción *',
              formData.descripcion || '',
              (text) => setFormData(prev => ({ ...prev, descripcion: text })),
              {
                placeholder: 'Descripción detallada del artículo y reparación',
                multiline: true,
                numberOfLines: 3,
                style: [styles.input, styles.textArea]
              }
            )}

            {renderField(
              'Número de Bodega *',
              formData.numeroBodega || '',
              (text) => setFormData(prev => ({ ...prev, numeroBodega: text })),
              {
                placeholder: 'B123456789',
                disabled: !!articulo, // No permitir editar si es existente
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

          <Divider style={styles.divider} />

          {/* Estado y Fechas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Estado y Fechas</Text>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Estado:</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchValue}>
                  {formData.estado === 'En Bodega' ? '📦 En Bodega' : '✅ Entregado'}
                </Text>
                <Switch
                  value={formData.estado === 'Entregado'}
                  onValueChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      estado: value ? 'Entregado' : 'En Bodega',
                      fechaEntrega: value ? new Date().toLocaleDateString('es-CL') : ''
                    }))
                  }
                />
              </View>
            </View>

            {renderField(
              'Fecha de Ingreso',
              formData.fechaIngreso || '',
              (text) => setFormData(prev => ({ ...prev, fechaIngreso: text })),
              {
                disabled: true,
                placeholder: 'dd/mm/yyyy'
              }
            )}

            {formData.estado === 'Entregado' && renderField(
              'Fecha de Entrega',
              formData.fechaEntrega || '',
              (text) => setFormData(prev => ({ ...prev, fechaEntrega: text })),
              {
                placeholder: 'dd/mm/yyyy',
                disabled: true
              }
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Observaciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Observaciones</Text>

            {renderField(
              'Observaciones',
              formData.observaciones || '',
              (text) => setFormData(prev => ({ ...prev, observaciones: text })),
              {
                placeholder: 'Notas adicionales sobre el artículo o reparación',
                multiline: true,
                numberOfLines: 3,
                style: [styles.input, styles.textArea]
              }
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Botones de Acción */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#ddd',
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchValue: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#D32F2F',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#D32F2F',
  },
});

export default ArticuloForm;