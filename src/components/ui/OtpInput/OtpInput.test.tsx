import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('рендерит значения посимвольно', () => {
    const { getByText } = renderWithTheme(<OtpInput value="123" onChange={() => {}} length={6} />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('фильтрует не-цифры и обрезает по length', () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <OtpInput value="" onChange={onChange} onComplete={onComplete} length={6} />,
    );
    fireEvent.changeText(getByLabelText('OTP-input'), 'a1b2c3d4e5f6g7');
    expect(onChange).toHaveBeenCalledWith('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('onComplete не вызывается при неполном вводе', () => {
    const onComplete = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <OtpInput value="" onChange={() => {}} onComplete={onComplete} length={6} />,
    );
    fireEvent.changeText(getByLabelText('OTP-input'), '12345');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
