import { render, screen } from '@testing-library/react-native';
import { MacroProgressBar } from './MacroProgressBar';
import { ThemeProvider } from '@/theme';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('MacroProgressBar', () => {
  it('рендерит label и значения', () => {
    render(<MacroProgressBar label="Белки" consumed={80} target={150} />, { wrapper: Wrapper });
    expect(screen.getByText('Белки')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
  });

  it('рендерит при target=0 без ошибок', () => {
    render(<MacroProgressBar label="Жиры" consumed={0} target={0} />, { wrapper: Wrapper });
    expect(screen.getByText('Жиры')).toBeTruthy();
  });

  it('рендерит корректно при превышении цели', () => {
    render(<MacroProgressBar label="Ккал" consumed={2500} target={2000} unit=" ккал" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('2500')).toBeTruthy();
  });
});
