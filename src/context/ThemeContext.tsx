import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { PALETTE } from '../constants/app';

const THEME_STORAGE_KEY = '@stokk_theme_preference';

const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

// Tema claro con nueva paleta
const PaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Colores principales
    primary: PALETTE.smartBlue,
    onPrimary: '#FFFFFF',
    primaryContainer: PALETTE.icyAqua,
    onPrimaryContainer: PALETTE.smartBlue,

    // Colores secundarios
    secondary: PALETTE.darkCyan,
    onSecondary: '#FFFFFF',
    secondaryContainer: PALETTE.pearlAqua,
    onSecondaryContainer: '#004D51',

    // Colores terciarios
    tertiary: PALETTE.steelBlue,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#D6E8F5',
    onTertiaryContainer: '#1A3A50',

    // Superficies
    background: '#F8FBFC',
    onBackground: '#1A1C1E',
    surface: '#FFFFFF',
    onSurface: '#1A1C1E',
    surfaceVariant: PALETTE.icyAqua,
    onSurfaceVariant: '#42474E',

    // Otros
    outline: PALETTE.steelBlue,
    outlineVariant: '#C2C7CE',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',

    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#F3F8F9',
      level2: '#EEF5F7',
      level3: '#E9F2F4',
      level4: '#E7F0F2',
      level5: '#E4EEF0',
    },
  },
};

// Tema oscuro con nueva paleta
const PaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Colores principales (más brillantes para modo oscuro)
    primary: PALETTE.smartBlueDark,
    onPrimary: '#002B5C',
    primaryContainer: '#1A4A8A',
    onPrimaryContainer: PALETTE.icyAquaDark,

    // Colores secundarios
    secondary: PALETTE.darkCyanDark,
    onSecondary: '#003739',
    secondaryContainer: '#004F52',
    onSecondaryContainer: PALETTE.pearlAquaDark,

    // Colores terciarios
    tertiary: PALETTE.steelBlueDark,
    onTertiary: '#1A3A50',
    tertiaryContainer: '#2E5470',
    onTertiaryContainer: '#D6E8F5',

    // Superficies
    background: '#0F1416',
    onBackground: '#E1E3E5',
    surface: '#1A1E20',
    onSurface: '#E1E3E5',
    surfaceVariant: '#2A3438',
    onSurfaceVariant: '#C2C7CE',

    // Otros
    outline: PALETTE.steelBlueDark,
    outlineVariant: '#42474E',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',

    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: '#1E2628',
      level2: '#232B2E',
      level3: '#283134',
      level4: '#2A3336',
      level5: '#2D383B',
    },
  },
};

const CombinedLightTheme = {
  ...PaperLightTheme,
  fonts: MD3LightTheme.fonts,
};

const CombinedDarkTheme = {
  ...PaperDarkTheme,
  fonts: MD3DarkTheme.fonts,
};

type ThemePreference = 'light' | 'dark' | 'system';

type AppTheme = typeof CombinedLightTheme | typeof CombinedDarkTheme;

type ThemeContextType = {
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  theme: AppTheme;
  navigationTheme: typeof NavLightTheme;
  isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  themePreference: 'system',
  setThemePreference: () => {},
  toggleTheme: () => {},
  theme: CombinedLightTheme,
  navigationTheme: NavLightTheme,
  isLoaded: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar preferencia guardada al iniciar
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedPreference &&
          ['light', 'dark', 'system'].includes(savedPreference)
        ) {
          setThemePreferenceState(savedPreference as ThemePreference);
        }
      } catch (error) {
        // Si falla, usar 'system' por defecto
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  // Guardar preferencia cuando cambia
  const setThemePreference = useCallback(
    async (preference: ThemePreference) => {
      setThemePreferenceState(preference);
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch (error) {
        // Error silencioso - la preferencia se aplicó en memoria
      }
    },
    []
  );

  // Calcular si está en modo oscuro según la preferencia
  const isDark =
    themePreference === 'system'
      ? systemScheme === 'dark'
      : themePreference === 'dark';

  // Toggle simple entre light y dark (guarda la preferencia)
  const toggleTheme = useCallback(() => {
    const newPreference: ThemePreference = isDark ? 'light' : 'dark';
    setThemePreference(newPreference);
  }, [isDark, setThemePreference]);

  const theme = useMemo(
    () => (isDark ? CombinedDarkTheme : CombinedLightTheme),
    [isDark]
  );

  const navigationTheme = useMemo(
    () => (isDark ? NavDarkTheme : NavLightTheme),
    [isDark]
  );

  const finalNavTheme = useMemo(
    () => ({
      ...navigationTheme,
      colors: {
        ...navigationTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outline,
        notification: theme.colors.error,
      },
    }),
    [navigationTheme, theme]
  );

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themePreference,
        setThemePreference,
        toggleTheme,
        theme,
        navigationTheme: finalNavTheme,
        isLoaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
