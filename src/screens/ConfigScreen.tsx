import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Card, Button, Switch } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';

const ConfigScreen: React.FC = () => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [autoBackup, setAutoBackup] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>⚙️ Configuración</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Apariencia</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Tema Oscuro</Text>
                <Text style={styles.switchDescription}>Activar tema oscuro para la aplicación</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
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
          onPress={() => console.log('Limpiar caché')}
          style={styles.dangerButton}
          buttonColor="#f44336"
        >
          Limpiar Caché
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
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
  },
  dangerButton: {
    marginBottom: 16,
  },
});

export default ConfigScreen;