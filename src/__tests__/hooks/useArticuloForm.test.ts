import { renderHook, act } from '@testing-library/react-native';
import { useArticuloForm } from '../../hooks/useArticuloForm';
import DatabaseManager from '../../database/DatabaseManager';
import SubscriptionService from '../../services/SubscriptionService';
import { Articulo } from '../../database/DatabaseManager';

// Mock dependencies
jest.mock('../../database/DatabaseManager');
jest.mock('../../services/SubscriptionService');
jest.mock('../../services/ImageService');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('useArticuloForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (DatabaseManager.contarArticulos as jest.Mock).mockResolvedValue(5);
    (SubscriptionService.isPro as jest.Mock).mockResolvedValue(false);
    (DatabaseManager.insertarArticulo as jest.Mock).mockResolvedValue(1);
    (DatabaseManager.actualizarArticulo as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  it('should initialize with empty form data', () => {
    const { result } = renderHook(() => useArticuloForm({}));

    expect(result.current.formData.nombre).toBe('');
    expect(result.current.formData.descripcion).toBe('');
    expect(result.current.formData.precio).toBe(0);
    expect(result.current.formData.cantidad).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.errors).toEqual([]);
  });

  it('should initialize with initial article data when provided', () => {
    const initialArticulo: Articulo = {
      id: 1,
      nombre: 'Existing Product',
      descripcion: 'Existing Description',
      precio: 500,
      cantidad: 10,
      imagen: '',
      numeroBodega: 'A1',
      observaciones: '',
      fechaIngreso: '2024-01-01',
    };

    const { result } = renderHook(() => useArticuloForm({ initialArticulo }));

    expect(result.current.formData.nombre).toBe('Existing Product');
    expect(result.current.formData.descripcion).toBe('Existing Description');
    expect(result.current.formData.precio).toBe(500);
    expect(result.current.formData.cantidad).toBe(10);
  });

  it('should update form data when handleFieldChange is called', () => {
    const { result } = renderHook(() => useArticuloForm({}));

    act(() => {
      result.current.handleFieldChange('nombre', 'New Product');
    });

    expect(result.current.formData.nombre).toBe('New Product');
  });

  it('should handle multiple field changes', () => {
    const { result } = renderHook(() => useArticuloForm({}));

    act(() => {
      result.current.handleFieldChange('nombre', 'New Product');
      result.current.handleFieldChange('precio', 100);
      result.current.handleFieldChange('cantidad', 5);
    });

    expect(result.current.formData.nombre).toBe('New Product');
    expect(result.current.formData.precio).toBe(100);
    expect(result.current.formData.cantidad).toBe(5);
  });

  it('should return handleSave and handleCancel functions', () => {
    const { result } = renderHook(() => useArticuloForm({}));

    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleCancel).toBe('function');
  });

  it('should check subscription limit on mount for new articles', async () => {
    renderHook(() => useArticuloForm({}));

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(DatabaseManager.contarArticulos).toHaveBeenCalled();
    expect(SubscriptionService.isPro).toHaveBeenCalled();
  });

  it('should not check subscription limit when editing existing article', async () => {
    const initialArticulo: Articulo = {
      id: 1,
      nombre: 'Existing',
      descripcion: '',
      precio: 100,
      cantidad: 1,
      imagen: '',
      numeroBodega: '',
      observaciones: '',
      fechaIngreso: '2024-01-01',
    };

    renderHook(() => useArticuloForm({ initialArticulo }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should not check limit when editing
    expect(DatabaseManager.contarArticulos).not.toHaveBeenCalled();
  });
});
