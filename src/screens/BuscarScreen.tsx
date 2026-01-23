import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, RefreshControl, Alert } from 'react-native';
import { Searchbar, Card, Text, IconButton, Chip } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import DatabaseManager, { Articulo } from '../database/DatabaseManager';
import { formatearMoneda } from '../utils/Validation';
import { BuscarScreenNavigationProp } from '../types/navigation';

import { useTranslation } from 'react-i18next';

const BuscarScreen: React.FC = () => {
  const navigation = useNavigation<BuscarScreenNavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueryRef = useRef(searchQuery);

  // Keep ref in sync with state
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const buscar = useCallback(async (query: string) => {
    if (!query.trim()) {
      setArticulos([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const resultados = await DatabaseManager.buscarArticulos(query.trim());
      setArticulos(resultados);
    } catch (error) {
      Alert.alert(t('common.error'), t('list.error_loading', 'No se pudo realizar la búsqueda'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Recargar cuando la pantalla obtiene foco (por si se editó un producto)
  useFocusEffect(
    useCallback(() => {
      if (searchQueryRef.current.trim()) {
        buscar(searchQueryRef.current);
      }
    }, [buscar])
  );

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce: buscar después de 300ms sin escribir
    debounceRef.current = setTimeout(() => {
      buscar(query);
    }, 300);
  };

  const handleEdit = (articulo: Articulo) => {
    navigation.navigate('Ingresar', { articulo });
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      t('list.delete_confirm_title'),
      t('list.delete_confirm_msg', { name: t('search.this_product') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.eliminarArticulo(id);
              // Actualizar lista después de eliminar
              buscar(searchQuery);
            } catch (error) {
              Alert.alert(t('common.error'), t('list.delete_error'));
            }
          }
        }
      ]
    );
  };

  const renderArticulo = ({ item }: { item: Articulo }) => (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleEdit(item)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.contentRow}>
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          ) : (
            <View style={[styles.placeholderThumbnail, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="image-not-supported" size={32} color={theme.colors.onSurfaceVariant} />
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={[styles.nombreProducto, { color: theme.colors.onSurface }]}>
              {item.nombre}
            </Text>
            <Text
              style={[styles.codigo, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {t('product.location_label').split('/')[1].trim()}: {item.numeroBodega}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.precio, { color: theme.colors.primary }]}>
                {formatearMoneda(item.precio)}
              </Text>
              <Chip
                icon="archive"
                style={styles.cantidadChip}
                textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
              >
                {item.cantidad}
              </Chip>
            </View>
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <IconButton
          icon="pencil"
          iconColor={theme.colors.primary}
          size={20}
          onPress={() => handleEdit(item)}
        />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          size={20}
          onPress={() => item.id && handleDelete(item.id)}
        />
      </Card.Actions>
    </Card>
  );

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={64} color={theme.colors.outline} />
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            {t('search.placeholder_title', 'Busca productos')}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.outline }]}>
            {t('search.placeholder_subtitle', 'Escribe el nombre o código de bodega')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="search-off" size={64} color={theme.colors.outline} />
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          {t('list.empty_search_msg')}
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.outline }]}>
          "{searchQuery}"
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('search.placeholder')}
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onClearIconPress={() => {
            setSearchQuery('');
            setArticulos([]);
            setHasSearched(false);
          }}
        />
        {hasSearched && articulos.length > 0 && (
          <Text style={[styles.resultCount, { color: theme.colors.onSurfaceVariant }]}>
            {articulos.length} {articulos.length === 1 ? t('search.result', 'resultado') : t('search.results', 'resultados')}
          </Text>
        )}
      </View>

      <FlatList
        data={articulos}
        renderItem={renderArticulo}
        keyExtractor={(item) => item.id?.toString() ?? `temp-${item.numeroBodega}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => buscar(searchQuery)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 2,
  },
  resultCount: {
    marginTop: 8,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardActions: {
    paddingTop: 0,
    paddingBottom: 4,
    justifyContent: 'flex-end',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nombreProducto: {
    fontSize: 16,
    fontWeight: '600',
  },
  codigo: {
    fontSize: 13,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  precio: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cantidadChip: {
    height: 26,
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
    paddingHorizontal: 32,
  },
});

export default BuscarScreen;
