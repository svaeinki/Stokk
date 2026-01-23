import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const THEME_STORAGE_KEY = '@stokk_theme_preference';

// Definir colores personalizados
const PRIMARY_COLOR = '#D32F2F';

const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});

const PaperLightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: PRIMARY_COLOR,
        onPrimary: '#FFFFFF',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        elevation: {
            ...MD3LightTheme.colors.elevation,
            level1: '#FFFFFF',
        }
    },
};

const PaperDarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#EF5350',
        onPrimary: '#000000',
        background: '#121212',
        surface: '#1E1E1E',
        elevation: {
            ...MD3DarkTheme.colors.elevation,
            level1: '#2C2C2C',
        }
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

type ThemeContextType = {
    isDark: boolean;
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;
    toggleTheme: () => void;
    theme: typeof CombinedLightTheme;
    navigationTheme: typeof NavLightTheme;
    isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    themePreference: 'system',
    setThemePreference: () => { },
    toggleTheme: () => { },
    theme: CombinedLightTheme,
    navigationTheme: NavLightTheme,
    isLoaded: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar preferencia guardada al iniciar
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedPreference && ['light', 'dark', 'system'].includes(savedPreference)) {
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
    const setThemePreference = useCallback(async (preference: ThemePreference) => {
        setThemePreferenceState(preference);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
        } catch (error) {
            // Error silencioso - la preferencia se aplicó en memoria
        }
    }, []);

    // Calcular si está en modo oscuro según la preferencia
    const isDark = themePreference === 'system'
        ? systemScheme === 'dark'
        : themePreference === 'dark';

    // Toggle simple entre light y dark (guarda la preferencia)
    const toggleTheme = useCallback(() => {
        const newPreference: ThemePreference = isDark ? 'light' : 'dark';
        setThemePreference(newPreference);
    }, [isDark, setThemePreference]);

    const theme = isDark ? CombinedDarkTheme : CombinedLightTheme;
    const navigationTheme = isDark ? NavDarkTheme : NavLightTheme;

    const finalNavTheme = {
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
    };

    return (
        <ThemeContext.Provider value={{
            isDark,
            themePreference,
            setThemePreference,
            toggleTheme,
            theme,
            navigationTheme: finalNavTheme,
            isLoaded,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
