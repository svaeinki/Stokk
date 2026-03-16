import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import ArticuloList from '../components/ArticuloList';
import { Articulo } from '../database/DatabaseManager';
import { useNavigation } from '@react-navigation/native';
import { InventarioScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const InventarioScreen: React.FC = () => {
  const navigation = useNavigation<InventarioScreenNavigationProp>();
  const { theme } = useTheme();

  const handleEdit = useCallback(
    (articulo: Articulo) => {
      navigation.navigate('Ingresar', { articulo });
    },
    [navigation]
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('Ingresar');
  }, [navigation]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ArticuloList onEdit={handleEdit} onAdd={handleAdd} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default InventarioScreen;
