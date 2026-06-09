import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useFocusEffect } from '@react-navigation/native';
import BuscarScreen from '../../screens/BuscarScreen';
import DatabaseManager, { Articulo } from '../../database/DatabaseManager';

jest.mock('../../database/DatabaseManager', () => ({
  buscarArticulos: jest.fn(),
  eliminarArticulo: jest.fn(),
}));

const mockShowError = jest.fn();
jest.mock('../../context/SnackbarContext', () => ({
  useSnackbar: () => ({
    showSuccess: jest.fn(),
    showError: mockShowError,
    showInfo: jest.fn(),
  }),
}));

const mockBuscar = DatabaseManager.buscarArticulos as jest.Mock;

const articulos: Articulo[] = [
  {
    id: 1,
    nombre: 'Taladro',
    descripcion: 'Taladro percutor',
    precio: 49990,
    cantidad: 3,
    numeroBodega: 'A1',
    fechaIngreso: '2026-01-01',
  },
  {
    id: 2,
    nombre: 'Taladro inalámbrico',
    descripcion: '',
    precio: 89990,
    cantidad: 1,
    numeroBodega: 'B2',
    fechaIngreso: '2026-01-02',
  },
];

const typeAndDebounce = async (
  input: ReturnType<typeof render>,
  text: string
) => {
  fireEvent.changeText(input.getByPlaceholderText('search.placeholder'), text);
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
};

describe('BuscarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // The screen re-fetches on focus; disable it here so tests exercise the
    // debounced search path deterministically
    (useFocusEffect as unknown as jest.Mock).mockImplementation(() => {});
    mockBuscar.mockResolvedValue(articulos);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show the initial empty state without searching', () => {
    const screen = render(<BuscarScreen />);

    expect(screen.getByText('search.placeholder_title')).toBeTruthy();
    expect(mockBuscar).not.toHaveBeenCalled();
  });

  it('should search after the debounce and render results', async () => {
    const screen = render(<BuscarScreen />);

    await typeAndDebounce(screen, 'taladro');

    expect(mockBuscar).toHaveBeenCalledTimes(1);
    expect(mockBuscar).toHaveBeenCalledWith('taladro');
    expect(screen.getByText('Taladro')).toBeTruthy();
    expect(screen.getByText('Taladro inalámbrico')).toBeTruthy();
  });

  it('should debounce rapid typing into a single search', async () => {
    const screen = render(<BuscarScreen />);
    const input = screen.getByPlaceholderText('search.placeholder');

    fireEvent.changeText(input, 'ta');
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.changeText(input, 'tal');
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.changeText(input, 'taladro');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockBuscar).toHaveBeenCalledTimes(1);
    expect(mockBuscar).toHaveBeenCalledWith('taladro');
  });

  it('should show the no-results state when the search returns nothing', async () => {
    mockBuscar.mockResolvedValue([]);
    const screen = render(<BuscarScreen />);

    await typeAndDebounce(screen, 'inexistente');

    expect(screen.getByText('list.empty_search_msg')).toBeTruthy();
  });

  it('should show an error snackbar when the search fails', async () => {
    mockBuscar.mockRejectedValue(new Error('db error'));
    const screen = render(<BuscarScreen />);

    await typeAndDebounce(screen, 'taladro');

    expect(mockShowError).toHaveBeenCalledWith('list.error_loading');
  });

  it('should clear results without searching when the query is emptied', async () => {
    const screen = render(<BuscarScreen />);
    await typeAndDebounce(screen, 'taladro');
    expect(screen.getByText('Taladro')).toBeTruthy();

    await typeAndDebounce(screen, '');

    expect(screen.queryByText('Taladro')).toBeNull();
    expect(screen.getByText('search.placeholder_title')).toBeTruthy();
    // Only the first search hit the database
    expect(mockBuscar).toHaveBeenCalledTimes(1);
  });
});
