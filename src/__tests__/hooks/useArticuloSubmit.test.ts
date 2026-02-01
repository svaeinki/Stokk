import { renderHook, act } from '@testing-library/react-native';
import { useArticuloSubmit } from '../../hooks/useArticuloSubmit';
import DatabaseManager from '../../database/DatabaseManager';
import { Articulo } from '../../database/DatabaseManager';

// Mock dependencies
jest.mock('../../database/DatabaseManager');
jest.mock('../../services/ImageService', () => ({
  saveImage: jest.fn().mockResolvedValue('saved-image-uri'),
  deleteImage: jest.fn().mockResolvedValue(undefined),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('useArticuloSubmit', () => {
  const mockFormData: Partial<Articulo> = {
    nombre: 'Test Product',
    descripcion: 'Test Description',
    precio: 100,
    cantidad: 5,
    imagen: '',
    numeroBodega: '',
    observaciones: '',
    fechaIngreso: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (DatabaseManager.insertarArticulo as jest.Mock).mockResolvedValue(1);
    (DatabaseManager.actualizarArticulo as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  it('should return loading, errors, handleSave, and handleCancel', () => {
    const { result } = renderHook(() => useArticuloSubmit());

    expect(result.current.loading).toBe(false);
    expect(result.current.errors).toEqual([]);
    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleCancel).toBe('function');
  });

  it('should insert a new article successfully', async () => {
    const mockOnSuccess = jest.fn();
    const { result } = renderHook(() =>
      useArticuloSubmit({ onSuccess: mockOnSuccess })
    );

    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.handleSave(mockFormData);
    });

    expect(saveResult!).toBe(true);
    expect(DatabaseManager.insertarArticulo).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Inventario');
  });

  it('should update an existing article', async () => {
    const mockOnSuccess = jest.fn();
    const existingArticle: Articulo = {
      id: 1,
      ...mockFormData,
    } as Articulo;

    const { result } = renderHook(() =>
      useArticuloSubmit({
        initialArticulo: existingArticle,
        onSuccess: mockOnSuccess,
      })
    );

    await act(async () => {
      await result.current.handleSave(mockFormData);
    });

    expect(DatabaseManager.actualizarArticulo).toHaveBeenCalledWith(
      1,
      expect.any(Object)
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should call onError for validation errors', async () => {
    const mockOnError = jest.fn();
    const { result } = renderHook(() =>
      useArticuloSubmit({ onError: mockOnError })
    );

    const invalidData = { ...mockFormData, nombre: '' };

    await act(async () => {
      await result.current.handleSave(invalidData);
    });

    expect(mockOnError).toHaveBeenCalled();
    expect(DatabaseManager.insertarArticulo).not.toHaveBeenCalled();
  });

  it('should navigate to Inventario on cancel', () => {
    const { result } = renderHook(() => useArticuloSubmit());

    act(() => {
      result.current.handleCancel();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Inventario');
  });

  it('should handle database errors gracefully', async () => {
    const mockOnError = jest.fn();
    (DatabaseManager.insertarArticulo as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const { result } = renderHook(() =>
      useArticuloSubmit({ onError: mockOnError })
    );

    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.handleSave(mockFormData);
    });

    expect(saveResult!).toBe(false);
    expect(mockOnError).toHaveBeenCalled();
  });
});
