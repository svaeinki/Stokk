import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { Card, TextInput, Button, Divider } from 'react-native-paper';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import { validarRUT, formatearRUT, generarNumeroBodega, validarFormularioArticulo } from '../utils/Validation';

const IngresarScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    rut: '',
    nombreCliente: '',
    telefono: '',
    tipoArticulo: '',
    descripcion: '',
    numeroBodega: generarNumeroBodega(),
    observaciones: '',
    estado: 'En Bodega' as const,
    fechaIngreso: new Date().toLocaleDateString('es-CL'),
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const validation = validarFormularioArticulo(formData);
    if (!validation.isValid) {
      Alert.alert('Error', validation.errors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      await DatabaseManager.insertarArticulo(formData as Omit<Articulo, 'id'>);
      Alert.alert('Éxito', 'Artículo guardado correctamente');
      // Reset form
      setFormData({
        rut: '',
        nombreCliente: '',
        telefono: '',
        tipoArticulo: '',
        descripcion: '',
        numeroBodega: generarNumeroBodega(),
        observaciones: '',
        estado: 'En Bodega',
        fechaIngreso: new Date().toLocaleDateString('es-CL'),
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar el artículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>➕ Nuevo Artículo</Text>

          <TextInput
            label="RUT *"
            value={formData.rut}
            onChangeText={(text) => setFormData({ ...formData, rut: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Nombre Cliente *"
            value={formData.nombreCliente}
            onChangeText={(text) => setFormData({ ...formData, nombreCliente: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Teléfono"
            value={formData.telefono}
            onChangeText={(text) => setFormData({ ...formData, telefono: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Divider style={styles.divider} />

          <TextInput
            label="Tipo de Artículo *"
            value={formData.tipoArticulo}
            onChangeText={(text) => setFormData({ ...formData, tipoArticulo: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Descripción *"
            value={formData.descripcion}
            onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="Número de Bodega"
            value={formData.numeroBodega}
            mode="outlined"
            disabled
            style={styles.input}
          />

          <TextInput
            label="Observaciones"
            value={formData.observaciones}
            onChangeText={(text) => setFormData({ ...formData, observaciones: text })}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          Guardar Artículo
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#D32F2F',
  },
});

export default IngresarScreen;