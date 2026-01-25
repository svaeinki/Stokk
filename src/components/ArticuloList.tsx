import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, StyleSheet, Alert, Image, RefreshControl } from 'react-native';
import { Card, Text, IconButton, Chip, FAB } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useSnackbar } from '../context/SnackbarContext';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import { formatearMoneda } from '../utils/Validation';
import Logger from '../utils/Logger';

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
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarArticulos = useCallback(async () => {
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
      Logger.error('Error al cargar artículos', error);
      showError(t('list.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter, t, showError]);

  useEffect(() => {
    cargarArticulos();
  }, [refreshTrigger, cargarArticulos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarArticulos();
    setRefreshing(false);
  }, [cargarArticulos]);

  const handleDelete = useCallback((id: number, nombre: string) => {
    Alert.alert(
      t('list.delete_confirm_title'),
      t('list.delete_confirm_msg', { name: nombre }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.eliminarArticulo(id);
              await cargarArticulos();
            } catch (error) {
              Logger.error('Error al eliminar', error);
              showError(t('list.delete_error'));
            }
          }
        }
      ]
    );
  }, [t, cargarArticulos, showError]);

  const renderArticulo = useCallback(({ item }: { item: Articulo }) => (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => onEdit(item)}
      accessible={true}
      accessibilityLabel={`${item.nombre}, ${formatearMoneda(item.precio)}, ${t('product.stock')}: ${item.cantidad}`}
      accessibilityHint={t('accessibility.tap_to_edit')}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.contentRow}>
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceVariant }]}
              accessibilityLabel={`${t('accessibility.image_of')} ${item.nombre}`}
            />
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
                {t('product.stock')}: {item.cantidad}
              </Chip>
            </View>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <IconButton
          icon="pencil"
          iconColor={theme.colors.primary}
          size={24}
          onPress={() => onEdit(item)}
          accessibilityLabel={`${t('common.edit')} ${item.nombre}`}
        />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          size={24}
          onPress={() => item.id !== undefined && handleDelete(item.id, item.nombre)}
          accessibilityLabel={`${t('common.delete')} ${item.nombre}`}
        />
      </Card.Actions>
    </Card>
  ), [theme, onEdit, handleDelete, t]);

  const keyExtractor = useCallback(
    (item: Articulo, index: number) => item.id?.toString() ?? `temp-${index}`,
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={articulos}
        renderItem={renderArticulo}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.list}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={64} color={theme.colors.outline} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>{t('list.empty_title')}</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? t('list.empty_search_msg') : t('list.empty_msg')}
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
        label={t('product.new_title')}
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

export default memo(ArticuloList);