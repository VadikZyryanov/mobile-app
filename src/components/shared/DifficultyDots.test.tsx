import { render } from '@testing-library/react-native';
import { DifficultyDots } from './DifficultyDots';

describe('DifficultyDots', () => {
  it('рендерит 5 точек', () => {
    const { getAllByTestId } = render(<DifficultyDots level={3} />);
    expect(getAllByTestId('dot')).toHaveLength(5);
  });
  it('отмечает level точек заполненными', () => {
    const { getAllByTestId } = render(<DifficultyDots level={2} />);
    const dots = getAllByTestId('dot');
    expect(dots[0].props.accessibilityState?.selected).toBe(true);
    expect(dots[1].props.accessibilityState?.selected).toBe(true);
    expect(dots[2].props.accessibilityState?.selected).toBe(false);
  });
});
