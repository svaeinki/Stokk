import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { useTheme } from './ThemeContext';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface SnackbarContextType {
  showSnackbar: (
    message: string,
    type?: SnackbarType,
    options?: {
      duration?: number;
      action?: { label: string; onPress: () => void };
    }
  ) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 4000;

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
    duration: DEFAULT_DURATION,
  });

  const hideSnackbar = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  const showSnackbar = useCallback((
    message: string,
    type: SnackbarType = 'info',
    options?: {
      duration?: number;
      action?: { label: string; onPress: () => void };
    }
  ) => {
    setState({
      visible: true,
      message,
      type,
      duration: options?.duration ?? (type === 'error' ? ERROR_DURATION : DEFAULT_DURATION),
      action: options?.action,
    });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showSnackbar(message, 'success');
  }, [showSnackbar]);

  const showError = useCallback((message: string) => {
    showSnackbar(message, 'error', { duration: ERROR_DURATION });
  }, [showSnackbar]);

  const showInfo = useCallback((message: string) => {
    showSnackbar(message, 'info');
  }, [showSnackbar]);

  // Colores según el tipo
  const getBackgroundColor = () => {
    switch (state.type) {
      case 'success':
        return '#4CAF50'; // Verde
      case 'error':
        return theme.colors.error;
      case 'info':
      default:
        return theme.colors.inverseSurface;
    }
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showInfo,
        hideSnackbar,
      }}
    >
      {children}
      <Snackbar
        visible={state.visible}
        onDismiss={hideSnackbar}
        duration={state.duration}
        action={state.action}
        style={{ backgroundColor: getBackgroundColor() }}
        theme={{
          colors: {
            inversePrimary: '#FFFFFF',
            inverseOnSurface: '#FFFFFF',
          }
        }}
      >
        {state.message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
