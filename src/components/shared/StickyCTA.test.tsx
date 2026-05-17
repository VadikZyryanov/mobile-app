import { SafeAreaProvider } from 'react-native-safe-area-context';

import { renderWithTheme } from '@/test-utils/render';
import { Button } from '@/components/ui';
import { StickyCTA } from './StickyCTA';

const SAFE_AREA_METRICS = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 320, height: 640 },
};

describe('StickyCTA', () => {
  it('рендерит переданный CTA', () => {
    const { getByText } = renderWithTheme(
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <StickyCTA>
          <Button label="Продолжить" onPress={() => {}} />
        </StickyCTA>
      </SafeAreaProvider>,
    );
    expect(getByText('Продолжить')).toBeTruthy();
  });
});
