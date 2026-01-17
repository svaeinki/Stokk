import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Card, Button, Searchbar, Chip, FAB } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import { calcularDiasEnBodega, obtenerClaseAlerta, formatearMoneda } from '../utils/Validation';

interface ArticuloListProps {
  onEdit: (articulo: Articulo) => void;
  onAdd: () => void;
}

const ArticuloList: React.FC<ArticuloListProps> = ({ onEdit, onAdd }) => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | 'enBodega' | 'entregados'>('todos');

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
      Alert.alert('Error', 'No se pudieron cargar los artículos');
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
        console.error('Error al buscar artículos:', error);
      }
    }
  };

  const eliminarArticulo = async (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este artículo?',
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
              console.error('Error al eliminar artículo:', error);
              Alert.alert('Error', 'No se pudo eliminar el artículo');
            }
          }
        }
      ]
    );
  };

  const cambiarEstado = async (articulo: Articulo) => {
    const nuevoEstado = articulo.estado === 'En Bodega' ? 'Entregado' : 'En Bodega';
    try {
      await DatabaseManager.actualizarArticulo(articulo.id!, { estado: nuevoEstado });
      await cargarArticulos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const getFilteredArticulos = () => {
    switch (filter) {
      case 'enBodega':
        return articulos.filter(a => a.estado === 'En Bodega');
      case 'entregados':
        return articulos.filter(a => a.estado === 'Entregado');
      default:
        return articulos;
    }
  };

  const getAlertaColor = (fechaIngreso: string) => {
    const clase = obtenerClaseAlerta(fechaIngreso);
    switch (clase) {
      case 'alerta-critica':
        return '#f44336';
      case 'alerta-warning':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  const renderArticulo = ({ item }: { item: Articulo }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.numeroBodega}>{item.numeroBodega}</Text>
            <Chip
              style={[
                styles.estadoChip,
                { backgroundColor: item.estado === 'En Bodega' ? '#4caf50' : '#9e9e9e' }
              ]}
              textStyle={{ color: 'white' }}
            >
              {item.estado}
            </Chip>
          </View>
          <View style={[styles.alertaIndicator, { backgroundColor: getAlertaColor(item.fechaIngreso) }]} />
        </View>

        <Text style={styles.cliente}>{item.nombreCliente}</Text>
        <Text style={styles.rut}>{item.rut}</Text>
        <Text style={styles.tipo}>{item.tipoArticulo}</Text>
        <Text style={styles.descripcion}>{item.descripcion}</Text>

        <View style={styles.footer}>
          <Text style={styles.fecha}>
            {calcularDiasEnBodega(item.fechaIngreso)}
          </Text>
          <Text style={styles.fechaIngreso}>
            {item.fechaIngreso}
          </Text>
        </View>

        {item.telefono && (
          <Text style={styles.telefono}>📞 {item.telefono}</Text>
        )}

        {item.observaciones && (
          <Text style={styles.observaciones}>📝 {item.observaciones}</Text>
        )}
      </Card.Content>

      <Card.Actions style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(item)}
        >
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.stateButton]}
          onPress={() => cambiarEstado(item)}
        >
          <Icon
            name={item.estado === 'En Bodega' ? 'check-circle' : 'undo'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => eliminarArticulo(item.id!)}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando artículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por RUT, nombre o número de bodega"
        onChangeText={buscarArticulos}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filters}>
        <Chip
          selected={filter === 'todos'}
          onPress={() => setFilter('todos')}
          style={styles.filterChip}
        >
          Todos ({articulos.length})
        </Chip>
        <Chip
          selected={filter === 'enBodega'}
          onPress={() => setFilter('enBodega')}
          style={styles.filterChip}
        >
          En Bodega ({articulos.filter(a => a.estado === 'En Bodega').length})
        </Chip>
        <Chip
          selected={filter === 'entregados'}
          onPress={() => setFilter('entregados')}
          style={styles.filterChip}
        >
          Entregados ({articulos.filter(a => a.estado === 'Entregado').length})
        </Chip>
      </View>

      <FlatList
        data={getFilteredArticulos()}
        renderItem={renderArticulo}
        keyExtractor={(item) => item.id?.toString() || ''}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay artículos</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'No se encontraron resultados' : 'Agrega tu primer artículo'}
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={onAdd}
        label="Agregar Artículo"
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  numeroBodega: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  estadoChip: {
    height: 24,
  },
  alertaIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cliente: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rut: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tipo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D32F2F',
    marginBottom: 4,
  },
  descripcion: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  fecha: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  fechaIngreso: {
    fontSize: 12,
    color: '#999',
  },
  telefono: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
  },
  observaciones: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  stateButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
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