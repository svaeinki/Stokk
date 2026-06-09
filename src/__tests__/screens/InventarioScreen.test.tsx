import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import InventarioScreen from '../../screens/InventarioScreen';

// Replace ArticuloList with a lightweight stub that exposes the callbacks
jest.mock('../../components/ArticuloList', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');
  const mockArticulo = {
    id: 7,
    nombre: 'Taladro',
    descripcion: '',
    precio: 19990,
    cantidad: 2,
    numeroBodega: 'A1',
    fechaIngreso: '2026-01-01',
  };
  const ArticuloListStub = ({
    onEdit,
    onAdd,
  }: {
    onEdit: (articulo: typeof mockArticulo) => void;
    onAdd: () => void;
  }) =>
    ReactActual.createElement(
      ReactActual.Fragment,
      null,
      ReactActual.createElement(
        Pressable,
        { testID: 'stub-edit', onPress: () => onEdit(mockArticulo) },
        ReactActual.createElement(Text, null, 'edit')
      ),
      ReactActual.createElement(
        Pressable,
        { testID: 'stub-add', onPress: onAdd },
        ReactActual.createElement(Text, null, 'add')
      )
    );
  return ArticuloListStub;
});

describe('InventarioScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the article list', () => {
    const { getByTestId } = render(<InventarioScreen />);

    expect(getByTestId('stub-add')).toBeTruthy();
  });

  it('should navigate to Ingresar without article when adding', () => {
    const navigation = useNavigation();
    const { getByTestId } = render(<InventarioScreen />);

    fireEvent.press(getByTestId('stub-add'));

    expect(navigation.navigate).toHaveBeenCalledWith('Ingresar', {
      articulo: undefined,
    });
  });

  it('should navigate to Ingresar with the article when editing', () => {
    const navigation = useNavigation();
    const { getByTestId } = render(<InventarioScreen />);

    fireEvent.press(getByTestId('stub-edit'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'Ingresar',
      expect.objectContaining({
        articulo: expect.objectContaining({ id: 7, nombre: 'Taladro' }),
      })
    );
  });
});
