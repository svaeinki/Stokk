import React from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

const BuscarScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { theme } = useTheme();

  const handleEdit = (articulo: any) => {
    Alert.alert(
      'Editar Artículo',
      `¿Deseas editar el artículo ${articulo.numeroBodega}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Editar', onPress: () => console.log('Editar:', articulo) }
      ]
    );
  };

  const handleAdd = () => {
    Alert.alert(
      'Agregar Artículo',
      'Esta función está en desarrollo',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>🔍 Buscar Artículos</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Busca por nombre o número de bodega
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar artículos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        icon="magnify"
      />

      {/* Aquí irá el componente ArticuloList con la búsqueda */}
      <View style={styles.placeholder}>
        <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>Resultados de búsqueda aparecerán aquí</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
});

export default BuscarScreen;