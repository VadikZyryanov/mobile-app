import { fireEvent, render } from '@testing-library/react-native';
import { ProgramCard } from './ProgramCard';

const p = {
  slug: '8-week',
  title: '8 недель',
  description: 'desc',
  cover_url: null,
  weeks: 8,
  sessions_per_week: 3,
  difficulty: 3,
  min_tier: 'pro' as const,
};

describe('ProgramCard', () => {
  it('рендерит title и weeks/sessions', () => {
    const { getByText } = render(<ProgramCard program={p} onPress={() => {}} />);
    expect(getByText('8 недель')).toBeTruthy();
    // regex с · чтобы матчить только meta-строку, не title
    expect(getByText(/нед ·/)).toBeTruthy();
    expect(getByText(/3 раз/)).toBeTruthy();
  });
  it('PRO badge', () => {
    const { getByText } = render(<ProgramCard program={p} onPress={() => {}} />);
    expect(getByText('PRO')).toBeTruthy();
  });
  it('onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<ProgramCard program={p} onPress={fn} />);
    fireEvent.press(getByText('8 недель'));
    expect(fn).toHaveBeenCalledWith('8-week');
  });
});
