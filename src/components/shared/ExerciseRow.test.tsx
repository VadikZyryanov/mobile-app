import { fireEvent, render } from '@testing-library/react-native';
import { ExerciseRow } from './ExerciseRow';

const row = {
  position: 1,
  exercise_slug: 'squat',
  exercise_name: 'Приседания',
  sets: 4,
  reps: '6-8',
  rest_seconds: 120,
};

describe('ExerciseRow', () => {
  it('рендерит name и sets/reps/rest', () => {
    const { getByText } = render(<ExerciseRow row={row} onPress={() => {}} />);
    expect(getByText('Приседания')).toBeTruthy();
    expect(getByText(/4×6-8/)).toBeTruthy();
    expect(getByText(/120/)).toBeTruthy();
  });
  it('показывает позицию', () => {
    const { getByText } = render(<ExerciseRow row={row} onPress={() => {}} />);
    expect(getByText('1')).toBeTruthy();
  });
  it('onPress передаёт slug', () => {
    const fn = jest.fn();
    const { getByText } = render(<ExerciseRow row={row} onPress={fn} />);
    fireEvent.press(getByText('Приседания'));
    expect(fn).toHaveBeenCalledWith('squat');
  });
});
