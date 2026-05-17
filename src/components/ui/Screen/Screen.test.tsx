import { Text } from 'react-native';

import { renderWithTheme } from '@/test-utils/render';
import { Screen } from './Screen';

describe('Screen', () => {
  it('рендерит контент', () => {
    const { getByText } = renderWithTheme(
      <Screen>
        <Text>Контент</Text>
      </Screen>,
    );
    expect(getByText('Контент')).toBeTruthy();
  });

  it('рендерит header и footer slots', () => {
    const { getByText } = renderWithTheme(
      <Screen header={<Text>Шапка</Text>} footer={<Text>Подвал</Text>}>
        <Text>Контент</Text>
      </Screen>,
    );
    expect(getByText('Шапка')).toBeTruthy();
    expect(getByText('Контент')).toBeTruthy();
    expect(getByText('Подвал')).toBeTruthy();
  });
});
