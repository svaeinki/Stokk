import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator
} from 'react-native';
import { Card, Button, Searchbar, Chip, FAB } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import { formatearMoneda, generarNumeroBodega } from '../utils/Validation';

interface ArticuloListProps {
  onEdit: (articulo: Articulo) => void;
  onAdd: () => void;
}

const ArticuloList: React.FC<ArticuloListProps> = ({ onEdit, onAdd }) => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    cargarArticulos();
  }, []);

  const cargarArticulos = async () => {
    try {
      setLoading(true);
      const data = await DatabaseManager.obtenerArticulos();
      setArticulos(data);
    } catch (error) {
      console.error('Error al cargar artículos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarArticulos();
    setRefreshing(false);
  };

  const buscarArticulos = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      await cargarArticulos();
    } else {
      try {
        const resultados = await DatabaseManager.buscarArticulos(query);
        setArticulos(resultados);
      } catch (error) {
        console.error('Error al buscar:', error);
      }
    }
  };

  const eliminarArticulo = async (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.eliminarArticulo(id);
              await cargarArticulos();
            } catch (error) {
              console.error('Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const renderArticulo = ({ item }: { item: Articulo }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.numeroBodega}>{item.numeroBodega}</Text>
          <Text style={styles.fechaIngreso}>{item.fechaIngreso}</Text>
        </View>

        <View style={styles.contentRow}>
          {item.imagen ? (
            <Image source={{ uri: item.imagen }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Icon name="image-not-supported" size={40} color="#ccc" />
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.nombreProducto}>{item.nombre}</Text>
            <Text style={styles.descripcion} numberOfLines={2}>
              {item.descripcion}
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.precio}>
                {formatearMoneda(item.precio)}
              </Text>
              <Chip icon="archive" style={styles.cantidadChip}>
                Stock: {item.cantidad}
              </Chip>
            </View>
          </View>
        </View>

        {item.observaciones && (
          <Text style={styles.observaciones}>📝 {item.observaciones}</Text>
        )}
      </Card.Content>

      <Card.Actions style={styles.actions}>
        <Button
          mode="text"
          onPress={() => onEdit(item)}
          textColor="#2196F3"
        >
          Editar
        </Button>
        <Button
          mode="text"
          onPress={() => eliminarArticulo(item.id!)}
          textColor="#f44336"
        >
          Eliminar
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por nombre o código..."
        onChangeText={buscarArticulos}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={articulos}
        renderItem={renderArticulo}
        keyExtractor={(item) => item.id?.toString() || ''}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Inventario vacío</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'No se encontraron resultados' : '¡Comienza agregando productos!'}
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={onAdd}
        label="Nuevo Producto"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  numeroBodega: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    backgroundColor: '#eee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fechaIngreso: {
    fontSize: 12,
    color: '#999',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  placeholderThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nombreProducto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  precio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  cantidadChip: {
    height: 28,
  },
  observaciones: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#D32F2F',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ArticuloList;