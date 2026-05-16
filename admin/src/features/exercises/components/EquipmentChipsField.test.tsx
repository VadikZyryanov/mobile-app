import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EquipmentChipsField } from './EquipmentChipsField';

describe('EquipmentChipsField', () => {
  it('Enter добавляет chip', () => {
    const onChange = vi.fn();
    render(<EquipmentChipsField value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Enter/i);
    fireEvent.change(input, { target: { value: 'Штанга' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Штанга']);
  });

  it('клик по X удаляет chip', () => {
    const onChange = vi.fn();
    render(<EquipmentChipsField value={['Штанга', 'Гантели']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Удалить Штанга'));
    expect(onChange).toHaveBeenCalledWith(['Гантели']);
  });

  it('Backspace на пустом инпуте удаляет последний', () => {
    const onChange = vi.fn();
    render(<EquipmentChipsField value={['A', 'B']} onChange={onChange} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/Enter/i), { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['A']);
  });
});
