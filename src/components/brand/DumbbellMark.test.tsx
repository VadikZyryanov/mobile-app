import { render } from '@testing-library/react-native';

import { DumbbellMark } from './DumbbellMark';

describe('DumbbellMark', () => {
  it('рендерится с дефолтными props', () => {
    const { getByTestId } = render(<DumbbellMark testID="mark" />);
    expect(getByTestId('mark')).toBeTruthy();
  });

  it('принимает кастомный размер и цвет без падений', () => {
    const { getByTestId } = render(<DumbbellMark size={40} color="#FF2D87" testID="mark" />);
    expect(getByTestId('mark')).toBeTruthy();
  });
});
