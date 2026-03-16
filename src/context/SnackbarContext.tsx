import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { Snackbar } from 'react-native-paper';
import { useTheme } from './ThemeContext';
import { COLORS } from '../constants/app';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarItem {
  message: string;
  type: SnackbarType;
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface SnackbarState {
  visible: boolean;
  current: SnackbarItem | null;
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

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 4000;

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    current: null,
  });
  const queueRef = useRef<SnackbarItem[]>([]);
  const isProcessingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }
    isProcessingRef.current = true;
    const next = queueRef.current.shift()!;
    setState({ visible: true, current: next });
  }, []);

  const hideSnackbar = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  // When snackbar becomes hidden, show next item in queue
  useEffect(() => {
    if (!state.visible && isProcessingRef.current) {
      const timer = setTimeout(showNext, 200);
      return () => clearTimeout(timer);
    }
  }, [state.visible, showNext]);

  const showSnackbar = useCallback(
    (
      message: string,
      type: SnackbarType = 'info',
      options?: {
        duration?: number;
        action?: { label: string; onPress: () => void };
      }
    ) => {
      const item: SnackbarItem = {
        message,
        type,
        duration:
          options?.duration ??
          (type === 'error' ? ERROR_DURATION : DEFAULT_DURATION),
        action: options?.action,
      };

      queueRef.current.push(item);

      if (!isProcessingRef.current) {
        showNext();
      }
    },
    [showNext]
  );

  const showSuccess = useCallback(
    (message: string) => {
      showSnackbar(message, 'success');
    },
    [showSnackbar]
  );

  const showError = useCallback(
    (message: string) => {
      showSnackbar(message, 'error', { duration: ERROR_DURATION });
    },
    [showSnackbar]
  );

  const showInfo = useCallback(
    (message: string) => {
      showSnackbar(message, 'info');
    },
    [showSnackbar]
  );

  // Colores según el tipo
  const getBackgroundColor = () => {
    switch (state.current?.type) {
      case 'success':
        return COLORS.success;
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
        duration={state.current?.duration}
        action={state.current?.action}
        style={{ backgroundColor: getBackgroundColor() }}
        theme={{
          colors: {
            inversePrimary: '#FFFFFF',
            inverseOnSurface: '#FFFFFF',
          },
        }}
      >
        {state.current?.message ?? ''}
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
