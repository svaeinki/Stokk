import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { Card, Button, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import DatabaseManager from '../database/DatabaseManager';
import { ConfigScreenNavigationProp } from '../types/navigation';
import { COLORS } from '../constants/app';
import Logger from '../utils/Logger';

const ConfigScreen: React.FC = () => {
  const navigation = useNavigation<ConfigScreenNavigationProp>();
  const { isDark, toggleTheme, theme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);

  const performReset = async () => {
    setIsResetting(true);
    try {
      await DatabaseManager.resetDatabase();
      Alert.alert('Éxito', 'Base de datos reiniciada correctamente.');
    } catch (error) {
      Logger.error('Error al resetear base de datos', error);
      Alert.alert('Error', 'No se pudo reiniciar la base de datos. Intenta de nuevo.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      '¿Estás seguro?',
      'Esta acción eliminará TODOS los productos y NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Eliminar Todo',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmación Final',
              '¿Realmente quieres borrar todo tu inventario?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'BORRAR TODO',
                  style: 'destructive',
                  onPress: performReset
                }
              ]
            )
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.primary }]}>⚙️ Configuración</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>💎 Suscripción</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>Versión PRO</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Desbloquea inventario ilimitado</Text>
              </View>
              <Button mode="contained" onPress={() => navigation.navigate('Paywall')} buttonColor={COLORS.gold} labelStyle={{ color: theme.colors.surface }}>
                Mejorar
              </Button>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>🎨 Apariencia</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>Tema Oscuro</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Activar tema oscuro para la aplicación</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>🔔 Notificaciones</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>Notificaciones Push</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Próximamente</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>💾 Respaldo de Datos</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>Backup Automático</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Próximamente</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>📥 Exportar Datos</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Próximamente</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>📤 Importar Datos</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Próximamente</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>ℹ️ Acerca de</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>📱 Versión</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>1.0.0</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>❓ Ayuda</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Próximamente</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>📧 Contacto</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>Próximamente</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleReset}
          style={styles.dangerButton}
          buttonColor={theme.colors.error}
          loading={isResetting}
          disabled={isResetting}
        >
          {isResetting ? 'Borrando...' : 'Borrar Todo (Reset)'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  switchContainer: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
  },
  buttonContainer: {
    padding: 16,
  },
  dangerButton: {
    marginBottom: 16,
  },
});

export default ConfigScreen;