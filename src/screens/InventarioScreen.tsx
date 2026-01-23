import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ArticuloList from '../components/ArticuloList';
import { Articulo } from '../database/DatabaseManager';
import { useNavigation } from '@react-navigation/native';
import { InventarioScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const InventarioScreen: React.FC = () => {
  const navigation = useNavigation<InventarioScreenNavigationProp>();
  const { theme } = useTheme();

  const handleEdit = (articulo: Articulo) => {
    Alert.alert(
      'Editar Artículo',
      `¿Deseas editar el artículo ${articulo.numeroBodega}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Editar', onPress: () => navigation.navigate('Ingresar', { articulo }) }
      ]
    );
  };

  const handleAdd = () => {
    navigation.navigate('Ingresar');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ArticuloList
        onEdit={handleEdit}
        onAdd={handleAdd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default InventarioScreen;