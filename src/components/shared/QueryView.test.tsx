import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { QueryView } from './QueryView';

describe('QueryView', () => {
  it('рендерит loading state', () => {
    const { getByText } = render(
      <QueryView isLoading isError={false} isEmpty={false} onRetry={() => {}}>
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('Загрузка')).toBeTruthy();
  });

  it('рендерит error state с кнопкой повтора', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <QueryView isLoading={false} isError isEmpty={false} onRetry={onRetry}>
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('Не удалось загрузить')).toBeTruthy();
    fireEvent.press(getByText('Повторить'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('рендерит empty state', () => {
    const { getByText } = render(
      <QueryView isLoading={false} isError={false} isEmpty emptyText="Пусто">
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('Пусто')).toBeTruthy();
  });

  it('рендерит children когда всё ок', () => {
    const { getByText } = render(
      <QueryView isLoading={false} isError={false} isEmpty={false}>
        <Text>content</Text>
      </QueryView>,
    );
    expect(getByText('content')).toBeTruthy();
  });
});
