import { renderHook, act } from '@testing-library/react-native';
import { useSubscriptionLimit } from '../../hooks/useSubscriptionLimit';
import DatabaseManager from '../../database/DatabaseManager';
import SubscriptionService from '../../services/SubscriptionService';

// Mock dependencies
jest.mock('../../database/DatabaseManager');
jest.mock('../../services/SubscriptionService');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('useSubscriptionLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return checkLimit function', () => {
    const { result } = renderHook(() => useSubscriptionLimit());

    expect(result.current.checkLimit).toBeDefined();
    expect(typeof result.current.checkLimit).toBe('function');
  });

  it('should return true when user is under the limit', async () => {
    (DatabaseManager.contarArticulos as jest.Mock).mockResolvedValue(5);
    (SubscriptionService.isPro as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useSubscriptionLimit());

    let checkResult: boolean;
    await act(async () => {
      checkResult = await result.current.checkLimit();
    });

    expect(checkResult!).toBe(true);
  });

  it('should return true when user is Pro', async () => {
    (DatabaseManager.contarArticulos as jest.Mock).mockResolvedValue(25);
    (SubscriptionService.isPro as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useSubscriptionLimit());

    let checkResult: boolean;
    await act(async () => {
      checkResult = await result.current.checkLimit();
    });

    expect(checkResult!).toBe(true);
  });

  it('should call onError when database check fails', async () => {
    const mockOnError = jest.fn();
    (DatabaseManager.contarArticulos as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const { result } = renderHook(() =>
      useSubscriptionLimit({ onError: mockOnError })
    );

    let checkResult: boolean;
    await act(async () => {
      checkResult = await result.current.checkLimit();
    });

    expect(checkResult!).toBe(false);
    expect(mockOnError).toHaveBeenCalled();
  });
});
