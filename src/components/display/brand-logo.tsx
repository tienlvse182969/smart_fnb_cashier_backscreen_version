import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useBrand } from '@/src/branding/brand-context';
import { useScale } from '@/src/theme/use-scale';

/**
 * Logo hiện trên màn hình khách: logo chuỗi nếu Owner đã tải lên, không thì (hoặc ảnh lỗi tải) logo nền tảng.
 * - `surface="light"`: nền sáng của màn hình (tiêu đề giỏ hàng, màn QR) — logo chuỗi vẽ trực tiếp.
 * - `surface="brand"`: nền màu chủ đạo — logo chuỗi đặt trong khung trắng bo góc vì logo thường thiết kế cho nền sáng
 *   và có thể trùng màu chủ đạo; logo nền tảng chọn bản trắng/đen theo màu chữ trên nền.
 */
export function BrandLogo({ surface, width, height }: { surface: 'light' | 'brand'; width: number; height: number }) {
  const brand = useBrand();
  const { s } = useScale();
  const [failedUri, setFailedUri] = useState<string>();
  useEffect(() => setFailedUri(undefined), [brand.logo]);

  if (brand.logo && failedUri !== brand.logo) {
    const logo = (
      <Image
        source={{ uri: brand.logo }}
        style={{ width, height }}
        contentFit="contain"
        onError={() => setFailedUri(brand.logo)}
      />
    );
    if (surface === 'light') return logo;
    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: s(10), padding: s(6) }}>{logo}</View>
    );
  }

  const white = surface === 'brand' && brand.primaryContrast === '#FFFFFF';
  return (
    <Image
      source={white ? require('../../../assets/logo/logo1_white.png') : require('../../../assets/logo/logo1.png')}
      style={{ width, height }}
      contentFit="contain"
    />
  );
}
