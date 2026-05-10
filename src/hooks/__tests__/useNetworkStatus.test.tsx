import { renderHook } from '@testing-library/react-native';

import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  it('returns isOnline true by default (mock is connected)', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });
});
