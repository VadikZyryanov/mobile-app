import { renderWithTheme } from '@/test-utils/render';
import { palette } from '@/theme';
import { Text } from './Text';

const flatten = (styleArr: unknown) =>
  Array.isArray(styleArr)
    ? Object.assign({}, ...styleArr.filter((s) => s && typeof s === 'object'))
    : ((styleArr as Record<string, unknown>) ?? {});

describe('Text', () => {
  it('рендерит контент', () => {
    const { getByText } = renderWithTheme(<Text>Hello</Text>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('применяет вариант типографики (fontSize)', () => {
    const { getByText } = renderWithTheme(<Text variant="hero">H</Text>);
    const flat = flatten(getByText('H').props.style);
    expect(flat.fontSize).toBe(34);
  });

  it('family="mono" применяет шрифт JetBrainsMono', () => {
    const { getByText } = renderWithTheme(
      <Text variant="body" family="mono">
        12
      </Text>,
    );
    const flat = flatten(getByText('12').props.style);
    expect(flat.fontFamily).toBe('JetBrainsMono_600SemiBold');
  });

  it('color="onAccent" использует cream поверх accent', () => {
    const { getByText } = renderWithTheme(<Text color="onAccent">A</Text>);
    const flat = flatten(getByText('A').props.style);
    expect(flat.color).toBe(palette.cream);
  });

  it('color="ink" использует palette.ink', () => {
    const { getByText } = renderWithTheme(<Text color="ink">I</Text>);
    const flat = flatten(getByText('I').props.style);
    expect(flat.color).toBe(palette.ink);
  });
});
