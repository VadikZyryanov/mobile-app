import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from './useDebouncedValue';

jest.useFakeTimers();

describe('useDebouncedValue', () => {
  it('возвращает initial value сразу', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('обновляет значение после задержки', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'ab' });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ab');
  });

  it('сбрасывает таймер при быстром изменении', () => {
    const { result, rerender } = renderHook(({ v }: { v: string }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'ab' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ v: 'abc' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });
});
