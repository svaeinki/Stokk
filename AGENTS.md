# AGENTS.md

This file provides comprehensive guidance for agentic coding agents working in the Stokk React Native + Expo codebase.

## Development Commands

```bash
# Start Expo development server
npm run start

# Platform-specific development
npm run ios          # iOS simulator/device
npm run android      # Android emulator/device
npm run web          # Web browser

# Remote tunnel for physical devices
npx expo start --tunnel

# EAS builds (requires EAS CLI setup)
eas build --profile development --platform ios
eas build --profile development --platform android
eas build --profile production --platform all
```

**Important Notes:**
- No test commands are currently configured
- No lint commands are currently configured
- Always run `npm run start` to verify changes work in Expo

## Architecture Overview

### Tech Stack
- **Framework:** React Native 0.81 + Expo SDK 54
- **Language:** TypeScript (strict mode enabled)
- **UI:** React Native Paper (Material Design 3)
- **Navigation:** React Navigation v7 (bottom tabs + native stack)
- **Storage:** expo-sqlite (SQLite), AsyncStorage
- **i18n:** i18next + react-i18next + expo-localization
- **Subscriptions:** RevenueCat (react-native-purchases)

### Project Structure
```
src/
├── components/     # Reusable UI components
├── context/        # React Context providers
├── database/       # DatabaseManager singleton
├── i18n/          # Internationalization
├── screens/       # Screen components
├── services/      # Singleton services
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── constants/     # App constants
```

## Code Style Guidelines

### Import Organization
Always organize imports in this exact order:
1. React imports
2. Third-party libraries (react-native, expo, etc.)
3. Internal imports (relative paths)

```typescript
// ✅ Correct order
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import DatabaseManager from '../database/DatabaseManager';
import Logger from '../utils/Logger';
```

### TypeScript Guidelines
- Use interfaces for data models
- Provide proper navigation types from `src/types/navigation.ts`
- Use strict mode - no implicit any
- Type all function parameters and return values

```typescript
// ✅ Correct typing
interface Articulo {
  id?: number;
  nombre: string;
  descripcion: string;
  // ... other fields
}

const handleEdit = (articulo: Articulo): void => {
  // implementation
};
```

### Component Patterns
- Use functional components with hooks
- Follow the `Screen` suffix for screen components
- Use `useTheme()` hook for theme integration
- Use `useTranslation()` hook for i18n

```typescript
// ✅ Correct component pattern
const InventarioScreen: React.FC = () => {
  const navigation = useNavigation<InventarioScreenNavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  // component logic
};
```

### Naming Conventions
- **Components:** PascalCase (e.g., `ArticuloForm`, `ArticuloList`)
- **Screens:** PascalCase + "Screen" suffix (e.g., `InventarioScreen`)
- **Services:** PascalCase (e.g., `SubscriptionService`, `ImageService`)
- **Files:** camelCase for utilities/types (e.g., `navigation.ts`, `Validation.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `FREE_TIER_PRODUCT_LIMIT`)

### Styling Guidelines
- Use StyleSheet.create for component styles
- Integrate theme colors dynamically: `theme.colors.primary`
- Avoid hardcoded colors - use theme or constants
- Keep styles outside the component body

```typescript
// ✅ Correct styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled by theme
  },
});

// In component
<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
```

## Error Handling Patterns

### Logger Usage
- Use Logger utility for all logging
- Logger automatically silences in production
- Include context in error messages

```typescript
// ✅ Correct error handling
try {
  await DatabaseManager.insertarArticulo(articulo);
} catch (error) {
  Logger.error('Error al guardar artículo', error);
  Alert.alert(t('common.error'), t('product.save_error'));
}
```

### Database Error Handling
- Always check database initialization
- Use prepared statements for queries
- Handle unique constraint violations gracefully

### User-Facing Errors
- Use Alert for user notifications
- Provide translated error messages via i18n
- Include actionable error messages when possible

## Architecture Guidelines

### Singleton Pattern Usage
- **DatabaseManager:** Use exported singleton, never instantiate
- **Services:** Use singleton pattern (SubscriptionService, ImageService)
- **Context:** Use context providers for global state

### Database Operations
- Always use DatabaseManager methods
- Use proper TypeScript interfaces for data models
- Handle image cleanup when deleting records
- Use transactions for multi-step operations

### Navigation Patterns
- Use typed navigation props from `src/types/navigation.ts`
- Follow the established navigation hierarchy
- Use proper parameter passing between screens

### State Management
- Use React Context for global state (ThemeContext)
- Use local state for component-specific data
- Persist user preferences in AsyncStorage

## i18n Guidelines

### Translation Keys
- Use dot notation for nested keys: `t('product.name_label')`
- Group related keys under common prefixes
- Provide context for similar strings

### Language Implementation
- Use `useTranslation()` hook in components
- Import from `src/i18n/index.ts` for configuration
- Handle language switching via `changeLanguage()` function

## Security and Performance Guidelines

### Security
- Never log sensitive data (passwords, tokens)
- Use proper permission handling for camera/gallery
- Validate all user inputs before processing
- Store API keys securely (not in source control)

### Performance
- Use SQLite indexes on frequently queried fields
- Optimize image handling with proper compression
- Use lazy loading for large lists
- Clean up resources in useEffect cleanup functions

### Memory Management
- Properly dispose of database connections
- Clean up image files when deleting records
- Use useCallback for expensive computations
- Avoid memory leaks in useEffect hooks

## Testing Considerations

**Current Status:** No test framework is configured

**Recommendations for future testing:**
- Set up Jest for unit testing
- Use React Native Testing Library for component testing
- Test database operations with in-memory SQLite
- Mock external dependencies (RevenueCat, ImagePicker)

## Common Patterns to Follow

### Form Handling
```typescript
const [formData, setFormData] = useState<Partial<Articulo>>({
  nombre: '',
  descripcion: '',
  // ... other fields
});

const handleInputChange = (field: keyof Articulo, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Permission Handling
```typescript
const requestPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    showPermissionDeniedAlert();
    return false;
  }
  return true;
};
```

### Async Data Loading
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DatabaseManager.obtenerArticulos();
      // handle data
    } catch (error) {
      Logger.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);
```

## File Organization Best Practices

- Keep components focused on single responsibility
- Separate business logic from UI components
- Use barrel exports for cleaner imports
- Group related functionality in directories
- Maintain consistent file naming conventions

## Constants and Configuration

- Use `src/constants/app.ts` for app-wide constants
- Define color palette in constants, not in components
- Use environment variables for configuration when possible
- Keep magic numbers and strings in constants

## Integration Notes

### RevenueCat Integration
- API keys are placeholders and need production values
- Handle subscription status changes gracefully
- Provide fallback UI for network issues

### Image Handling
- Use ImageService for all image operations
- Implement proper cleanup for temporary images
- Handle permission denied scenarios appropriately
- Optimize image size for mobile storage

This documentation should be updated as the codebase evolves and new patterns are established.