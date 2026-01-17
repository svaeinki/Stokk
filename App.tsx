import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import DatabaseManager from './src/database/DatabaseManager';

// Importar pantallas
import InventarioScreen from './src/screens/InventarioScreen';
import BuscarScreen from './src/screens/BuscarScreen';
import IngresarScreen from './src/screens/IngresarScreen';
import ConfigScreen from './src/screens/ConfigScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await DatabaseManager.initDatabase();
        console.log('✅ Base de datos inicializada correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
      } finally {
        setIsReady(true);
      }
    };

    initDatabase();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#D32F2F',
            tabBarInactiveTintColor: '#666',
            headerStyle: {
              backgroundColor: '#D32F2F',
            },
            headerTintColor: '#fff',
          }}
        >
          <Tab.Screen
            name="Inventario"
            component={InventarioScreen}
            options={{
              headerTitle: '📦 Inventario',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="inventory" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Buscar"
            component={BuscarScreen}
            options={{
              headerTitle: '🔍 Buscar',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="search" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Ingresar"
            component={IngresarScreen}
            options={{
              headerTitle: '➕ Ingresar',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="add-circle" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Config"
            component={ConfigScreen}
            options={{
              headerTitle: '⚙️ Configuración',
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="settings" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" backgroundColor="#D32F2F" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
