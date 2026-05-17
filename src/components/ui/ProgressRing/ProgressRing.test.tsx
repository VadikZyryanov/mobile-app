import { Text as RNText } from 'react-native';

import { renderWithTheme } from '@/test-utils/render';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('рендерится без падений при разных значениях progress', () => {
    expect(() => renderWithTheme(<ProgressRing progress={0} />)).not.toThrow();
    expect(() => renderWithTheme(<ProgressRing progress={0.42} />)).not.toThrow();
    expect(() => renderWithTheme(<ProgressRing progress={1} />)).not.toThrow();
  });

  it('кламп: progress > 1 не ломает рендер и показывает children по центру', () => {
    const { getByText } = renderWithTheme(
      <ProgressRing progress={1.7}>
        <RNText>100%</RNText>
      </ProgressRing>,
    );
    expect(getByText('100%')).toBeTruthy();
  });
});
