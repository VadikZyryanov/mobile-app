import { fireEvent, render } from '@testing-library/react-native';
import { WorkoutCard } from './WorkoutCard';

const w = {
  slug: 'upper-power',
  title: 'Верх тела',
  category: 'upper' as const,
  cover_url: null,
  duration_minutes: 45,
  difficulty: 3,
  min_tier: 'basic' as const,
};

describe('WorkoutCard', () => {
  it('рендерит title и duration', () => {
    const { getByText } = render(<WorkoutCard workout={w} onPress={() => {}} />);
    expect(getByText('Верх тела')).toBeTruthy();
    expect(getByText(/45/)).toBeTruthy();
  });
  it('показывает TierBadge для paid', () => {
    const { getByText } = render(<WorkoutCard workout={w} onPress={() => {}} />);
    expect(getByText('BASIC')).toBeTruthy();
  });
  it('не показывает badge для free', () => {
    const { queryByText } = render(
      <WorkoutCard workout={{ ...w, min_tier: 'free' }} onPress={() => {}} />,
    );
    expect(queryByText('FREE')).toBeNull();
  });
  it('вызывает onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<WorkoutCard workout={w} onPress={fn} />);
    fireEvent.press(getByText('Верх тела'));
    expect(fn).toHaveBeenCalledWith('upper-power');
  });
});
