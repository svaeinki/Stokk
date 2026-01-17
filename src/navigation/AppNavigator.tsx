import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Importar componentes
import InventarioScreen from '../screens/InventarioScreen';
import BuscarScreen from '../screens/BuscarScreen';
import IngresarScreen from '../screens/IngresarScreen';
import ConfigScreen from '../screens/ConfigScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Inventario':
              iconName = 'inventory';
              break;
            case 'Buscar':
              iconName = 'search';
              break;
            case 'Ingresar':
              iconName = 'add-circle';
              break;
            case 'Config':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D32F2F',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#D32F2F',
        },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen
        name="Inventario"
        component={InventarioScreen}
        options={{
          title: 'Inventario',
          headerTitle: '📦 Inventario',
        }}
      />
      <Tab.Screen
        name="Buscar"
        component={BuscarScreen}
        options={{
          title: 'Buscar',
          headerTitle: '🔍 Buscar Artículos',
        }}
      />
      <Tab.Screen
        name="Ingresar"
        component={IngresarScreen}
        options={{
          title: 'Ingresar',
          headerTitle: '➕ Ingresar Artículo',
        }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          title: 'Config',
          headerTitle: '⚙️ Configuración',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#D32F2F',
          },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false,
            title: 'Napoli Reparadora',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;