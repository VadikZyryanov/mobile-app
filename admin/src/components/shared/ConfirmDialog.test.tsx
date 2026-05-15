import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('confirm вызывает onConfirm и закрывает диалог', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Удалить?"
        description="Точно?"
        onConfirm={onConfirm}
        variant="destructive"
        confirmLabel="Да"
      />,
    );
    fireEvent.click(screen.getByText('Да'));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('cancel закрывает диалог без onConfirm', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog open onOpenChange={onOpenChange} title="Удалить?" onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByText('Отмена'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
