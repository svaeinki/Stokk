// Mock Expo modules
jest.mock('expo-file-system', () => ({
  Paths: {
    document: { uri: 'file:///tmp/documents/' },
    cache: { uri: 'file:///tmp/cache/' },
  },
  Directory: jest.fn().mockImplementation(() => ({
    exists: true,
    create: jest.fn(),
    delete: jest.fn(),
  })),
  File: jest.fn().mockImplementation(() => ({
    exists: true,
    copy: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(uri => Promise.resolve({ uri })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
  })),
}));

jest.mock('react-native-purchases', () => ({
  Purchases: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    getAppUserID: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    setLogLevel: jest.fn(),
    LOG_LEVEL: { DEBUG: 'DEBUG' },
    PURCHASES_ERROR_CODE: {
      PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
      PAYMENT_PENDING_ERROR: 'PAYMENT_PENDING_ERROR',
      PRODUCT_ALREADY_PURCHASED_ERROR: 'PRODUCT_ALREADY_PURCHASED_ERROR',
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'es',
    },
  }),
}));

// Mock ThemeContext
jest.mock('./src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#3066BE',
        background: '#F8FBFC',
        surface: '#FFFFFF',
        onSurface: '#1A1C1E',
        outline: '#6D9DC5',
        outlineVariant: '#C2C7CE',
        error: '#BA1A1A',
        onSurfaceVariant: '#42474E',
      },
    },
  }),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  getState: jest.fn(),
  getParent: jest.fn(),
  reset: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(fn => fn()),
  useIsFocused: jest.fn(() => true),
}));
