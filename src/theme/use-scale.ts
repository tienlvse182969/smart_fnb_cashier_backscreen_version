import { useWindowDimensions } from 'react-native';

/**
 * Hệ số co giãn theo kích thước tablet (thiết kế gốc 1280×800 ngang). Màn hình phía khách được
 * nhìn từ xa nên chữ/khoảng cách phải lớn theo màn hình, không cố định theo dp.
 */
export function useScale() {
  const { width, height } = useWindowDimensions();
  const k = Math.min(Math.max(Math.min(width / 1280, height / 800), 0.6), 1.6);
  return { width, height, s: (n: number) => Math.round(n * k) };
}
