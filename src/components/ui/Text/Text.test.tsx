import { renderWithTheme } from '@/test-utils/render';
import { Text } from './Text';

describe('Text', () => {
  it('рендерит контент', () => {
    const { getByText } = renderWithTheme(<Text>Hello</Text>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('применяет вариант типографики (fontSize)', () => {
    const { getByText } = renderWithTheme(<Text variant="hero">H</Text>);
    const styleArr = getByText('H').props.style;
    const flat = Array.isArray(styleArr) ? Object.assign({}, ...styleArr) : styleArr;
    expect(flat.fontSize).toBe(34);
  });
});
