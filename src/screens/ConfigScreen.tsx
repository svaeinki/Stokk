import React from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { Card, Button, Switch } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '../context/ThemeContext';
import DatabaseManager from '../database/DatabaseManager';

const ConfigScreen: React.FC<any> = (props) => {
  const { isDark, toggleTheme, theme } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [autoBackup, setAutoBackup] = React.useState(false);

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
                  onPress: async () => {
                    await DatabaseManager.resetDatabase();
                    Alert.alert('Éxito', 'Base de datos reiniciada.');
                  }
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
            <Text style={styles.sectionTitle}>💎 Suscripción</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Versión PRO</Text>
                <Text style={styles.switchDescription}>Desbloquea inventario ilimitado</Text>
              </View>
              <Button mode="contained" onPress={() => (props.navigation as any).navigate('Paywall')} color="#FFD700" labelStyle={{ color: 'white' }}>
                Mejorar
              </Button>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Apariencia</Text>
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
            <Text style={styles.sectionTitle}>🔔 Notificaciones</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Notificaciones Push</Text>
                <Text style={styles.switchDescription}>Recibir alertas sobre artículos antiguos</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Respaldo de Datos</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Backup Automático</Text>
                <Text style={styles.switchDescription}>Sincronizar datos con la nube</Text>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
              />
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>📥 Exportar Datos</Text>
                <Text style={styles.switchDescription}>Exportar toda la base de datos</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>📤 Importar Datos</Text>
                <Text style={styles.switchDescription}>Importar desde archivo de respaldo</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Acerca de</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>📱 Versión</Text>
                <Text style={styles.switchDescription}>1.0.0</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>❓ Ayuda</Text>
                <Text style={styles.switchDescription}>Ver guía de uso</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>📧 Contacto</Text>
                <Text style={styles.switchDescription}>Soporte técnico</Text>
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
        >
          Borrar Todo (Reset)
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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