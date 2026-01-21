import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, RefreshControl } from 'react-native';
import { Card, Text, IconButton, Chip, FAB } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import { formatearMoneda } from '../utils/Validation';

interface ArticuloListProps {
  refreshTrigger?: number;
  onEdit: (articulo: Articulo) => void;
  onAdd: () => void;
  searchQuery?: string;
  filter?: string;
}

const ArticuloList: React.FC<ArticuloListProps> = ({
  refreshTrigger,
  onEdit,
  onAdd,
  searchQuery = '',
  filter = 'todos'
}) => {
  const { theme } = useTheme();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarArticulos();
  }, [refreshTrigger, searchQuery, filter]);

  const cargarArticulos = async () => {
    try {
      setLoading(true);
      let data: Articulo[] = [];
      if (searchQuery.trim() !== '') {
        data = await DatabaseManager.buscarArticulos(searchQuery);
      } else {
        data = await DatabaseManager.obtenerArticulos();
      }

      if (filter === 'sinStock') {
        data = data.filter(item => item.cantidad === 0);
      }

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

  const handleDelete = async (id: number) => {
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
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => onEdit(item)}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.contentRow}>
          {item.imagen ? (
            <Image source={{ uri: item.imagen }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.placeholderThumbnail, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="image-not-supported" size={40} color={theme.colors.onSurfaceVariant} />
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={[styles.nombreProducto, { color: theme.colors.onSurface }]}>{item.nombre}</Text>
            <Text style={[styles.descripcion, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {item.descripcion}
            </Text>

            <View style={styles.priceRow}>
              <Text style={[styles.precio, { color: theme.colors.primary }]}>
                {formatearMoneda(item.precio)}
              </Text>
              <Chip icon="archive" style={styles.cantidadChip} textStyle={{ color: theme.colors.onSecondaryContainer }}>
                Stock: {item.cantidad}
              </Chip>
            </View>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <IconButton
          icon="pencil"
          iconColor={theme.colors.primary}
          onPress={() => onEdit(item)}
        />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          onPress={() => handleDelete(item.id!)}
        />
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={articulos}
        renderItem={renderArticulo}
        keyExtractor={(item) => item.id?.toString() || ''}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color={theme.colors.outline} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Inventario vacío</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? 'No se encontraron resultados' : '¡Comienza agregando productos!'}
              </Text>
            </View>
          ) : null
        }
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color={theme.colors.onPrimary}
        onPress={onAdd}
        label="Nuevo Producto"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  nombreProducto: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  descripcion: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  precio: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cantidadChip: {
    height: 28,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ArticuloList;