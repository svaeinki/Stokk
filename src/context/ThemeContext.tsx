import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import {
    MD3LightTheme,
    MD3DarkTheme,
    adaptNavigationTheme,
} from 'react-native-paper';
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

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
    fonts: MD3LightTheme.fonts, // Force MD3 fonts
};

const CombinedDarkTheme = {
    ...PaperDarkTheme,
    fonts: MD3DarkTheme.fonts, // Force MD3 fonts
};

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    theme: typeof CombinedLightTheme; // Paper Theme
    navigationTheme: typeof NavLightTheme; // Navigation Theme
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    toggleTheme: () => { },
    theme: CombinedLightTheme,
    navigationTheme: NavLightTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scheme = useColorScheme();
    const [isDark, setIsDark] = useState(scheme === 'dark');

    useEffect(() => {
        setIsDark(scheme === 'dark');
    }, [scheme]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    const theme = isDark ? CombinedDarkTheme : CombinedLightTheme;
    const navigationTheme = isDark ? NavDarkTheme : NavLightTheme;

    // Ensure navigation theme matches paper colors where possible
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
        <ThemeContext.Provider value={{ isDark, toggleTheme, theme, navigationTheme: finalNavTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
