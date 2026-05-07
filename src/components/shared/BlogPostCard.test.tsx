import { fireEvent, render } from '@testing-library/react-native';
import { BlogPostCard } from './BlogPostCard';

const post = {
  slug: 'how-to-squat',
  title: 'Как приседать',
  excerpt: 'about squat',
  cover_url: null,
  published_at: '2026-05-01T10:00:00Z',
};

describe('BlogPostCard', () => {
  it('рендерит title/excerpt', () => {
    const { getByText } = render(<BlogPostCard post={post} onPress={() => {}} />);
    expect(getByText('Как приседать')).toBeTruthy();
    expect(getByText('about squat')).toBeTruthy();
  });
  it('форматирует дату', () => {
    const { getByText } = render(<BlogPostCard post={post} onPress={() => {}} />);
    expect(getByText(/01\.05\.2026|1 мая 2026/)).toBeTruthy();
  });
  it('onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<BlogPostCard post={post} onPress={fn} />);
    fireEvent.press(getByText('Как приседать'));
    expect(fn).toHaveBeenCalledWith('how-to-squat');
  });
});
