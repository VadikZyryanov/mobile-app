import { darkColors, lightColors, palette } from './colors';

describe('palette', () => {
  it('содержит фиксированные значения brand (Knyazeva Team)', () => {
    expect(palette.pink).toBe('#FF2D87');
    expect(palette.ink).toBe('#0A0910');
    expect(palette.cream).toBe('#EFE6D4');
    expect(palette.beigeSoft).toBe('rgba(232,220,196,0.6)');
  });

  it('darkColors используют brand tokens', () => {
    expect(darkColors.bg).toBe(palette.ink);
    expect(darkColors.text).toBe(palette.cream);
    expect(darkColors.accent).toBe(palette.pink);
  });

  it('lightColors временно зеркалят darkColors (удаляются в D7)', () => {
    expect(lightColors).toEqual(darkColors);
  });

  it('snapshot', () => {
    expect({ palette, dark: darkColors, light: lightColors }).toMatchSnapshot();
  });
});
