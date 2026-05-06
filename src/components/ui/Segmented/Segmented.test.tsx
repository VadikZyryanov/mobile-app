import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Segmented } from './Segmented';

const OPTS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const;

describe('Segmented', () => {
  it('рендерит обе опции', () => {
    const { getByText } = renderWithTheme(
      <Segmented value="email" options={OPTS} onChange={() => {}} />,
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Phone')).toBeTruthy();
  });

  it('вызывает onChange при тапе', () => {
    const onChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Segmented value="email" options={OPTS} onChange={onChange} />,
    );
    fireEvent.press(getByText('Phone'));
    expect(onChange).toHaveBeenCalledWith('phone');
  });

  it('подсвечивает выбранную (accessibilityState.selected)', () => {
    const { getByRole } = renderWithTheme(
      <Segmented value="phone" options={OPTS} onChange={() => {}} />,
    );
    const phoneTab = getByRole('tab', { name: 'Phone' });
    expect(phoneTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  });
});
