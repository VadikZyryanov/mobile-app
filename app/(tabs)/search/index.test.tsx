import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { supabase } from '@/lib/supabase';
import { makeQueryWrapper } from '@/test-utils/queryWrapper';

import SearchScreen from './index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/storage', () => ({ getPublicUrl: jest.fn(() => null) }));

jest.useFakeTimers();

const rpcMock = supabase.rpc as jest.Mock;

describe('SearchScreen', () => {
  beforeEach(() => rpcMock.mockReset());

  it('запускает поиск после ввода', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          kind: 'exercise',
          id: '1',
          slug: 'squat',
          title: 'Squat',
          subtitle: 'quads',
          cover_path: null,
          min_tier: 'pro',
          rank: 1,
        },
      ],
      error: null,
    });
    const { Wrapper } = makeQueryWrapper();
    const { getByPlaceholderText, findByText } = render(<SearchScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Поиск по тренировкам и упражнениям'), 'squat');
    jest.advanceTimersByTime(300);
    await waitFor(async () => expect(await findByText('Squat')).toBeTruthy());
  });
});
