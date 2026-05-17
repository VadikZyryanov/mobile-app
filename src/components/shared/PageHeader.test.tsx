import { renderWithTheme } from '@/test-utils/render';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('рендерит заголовок', () => {
    const { getByText } = renderWithTheme(<PageHeader title="Тренировки" />);
    expect(getByText('Тренировки')).toBeTruthy();
  });

  it('рендерит subLabel при наличии', () => {
    const { getByText } = renderWithTheme(<PageHeader title="Питание" subLabel="СЕГОДНЯ" />);
    expect(getByText('Питание')).toBeTruthy();
    expect(getByText('СЕГОДНЯ')).toBeTruthy();
  });
});
