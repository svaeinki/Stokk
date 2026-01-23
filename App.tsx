import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import DatabaseManager from './src/database/DatabaseManager';
import { RootStackParamList, TabParamList } from './src/types/navigation';

// Importar pantallas
import InventarioScreen from './src/screens/InventarioScreen';
import BuscarScreen from './src/screens/BuscarScreen';
import IngresarScreen from './src/screens/IngresarScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        }
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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const { theme, navigationTheme } = useTheme();

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await DatabaseManager.initDatabase();
        setIsReady(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setDbError(errorMessage);
        setIsReady(true);
      }
    };

    initDatabase();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>Cargando...</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.onSurface }]}>Error de Base de Datos</Text>
        <Text style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
          No se pudo inicializar el almacenamiento local.
        </Text>
        <Text style={[styles.errorDetail, { color: theme.colors.outline }]}>{dbError}</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{
              presentation: 'modal',
              headerShown: false
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  errorDetail: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
