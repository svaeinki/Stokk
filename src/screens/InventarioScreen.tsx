import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ArticuloList from '../components/ArticuloList';
import DatabaseManager from '../database/DatabaseManager';

import { useNavigation } from '@react-navigation/native';

const InventarioScreen: React.FC = () => {
  const navigation = useNavigation();

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
    // @ts-ignore - La navegación de tabs maneja esto
    navigation.navigate('Ingresar');
  };

  return (
    <View style={styles.container}>
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
    backgroundColor: '#f5f5f5',
  },
});

export default InventarioScreen;