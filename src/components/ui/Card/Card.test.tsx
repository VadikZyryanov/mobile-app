import { Text } from 'react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Card } from './Card';

describe('Card', () => {
  it('рендерит детей в base-варианте', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <Text>Inside</Text>
      </Card>,
    );
    expect(getByText('Inside')).toBeTruthy();
  });

  it('рендерит детей в glass-варианте', () => {
    const { getByText } = renderWithTheme(
      <Card variant="glass">
        <Text>Glassed</Text>
      </Card>,
    );
    expect(getByText('Glassed')).toBeTruthy();
  });
});
