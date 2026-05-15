import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DebouncedSearchInput } from './DebouncedSearchInput';

describe('DebouncedSearchInput', () => {
  it('вызывает onChange после задержки', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<DebouncedSearchInput value="" onChange={onChange} debounceMs={200} />);
    fireEvent.change(screen.getByPlaceholderText('Поиск'), { target: { value: 'abc' } });
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onChange).toHaveBeenCalledWith('abc');
    vi.useRealTimers();
  });
});
