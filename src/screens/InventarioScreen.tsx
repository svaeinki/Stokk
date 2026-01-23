import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArticuloList from '../components/ArticuloList';
import { Articulo } from '../database/DatabaseManager';
import { useNavigation } from '@react-navigation/native';
import { InventarioScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const InventarioScreen: React.FC = () => {
  const navigation = useNavigation<InventarioScreenNavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleEdit = (articulo: Articulo) => {
    Alert.alert(
      t('list.edit_title'),
      t('list.edit_confirm_msg', { code: articulo.numeroBodega }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.edit'), onPress: () => navigation.navigate('Ingresar', { articulo }) }
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