import { darkColors, lightColors, palette } from './colors';

describe('palette', () => {
  it('содержит фиксированные значения brand', () => {
    expect(palette.blue).toBe('#2563EB');
    expect(palette.black).toBe('#0A0A0A');
    expect(palette.white).toBe('#FAFAFA');
    expect(palette.gray400).toBe('#6B7280');
  });

  it('snapshot', () => {
    expect({ palette, dark: darkColors, light: lightColors }).toMatchSnapshot();
  });
});
