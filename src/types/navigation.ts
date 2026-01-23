import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Articulo } from '../database/DatabaseManager';

// Params para el Tab Navigator (pantallas principales)
export type TabParamList = {
  Inventario: undefined;
  Buscar: undefined;
  Ingresar: { articulo?: Articulo } | undefined;
  Config: undefined;
};

// Params para el Stack Navigator (root)
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Paywall: undefined;
};

// Tipo de navegación para screens dentro de tabs que necesitan navegar al stack
export type TabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Tipos específicos para cada screen
export type InventarioScreenNavigationProp = TabScreenNavigationProp;
export type BuscarScreenNavigationProp = TabScreenNavigationProp;
export type IngresarScreenNavigationProp = TabScreenNavigationProp;
export type ConfigScreenNavigationProp = TabScreenNavigationProp;
export type PaywallScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
