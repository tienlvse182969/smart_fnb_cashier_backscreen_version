import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';

import { useScale } from '@/src/theme/use-scale';

/** Màu nền của splash native (app.json) — gần với tông màu ảnh nền để chuyển cảnh không bị chớp. */
export const SPLASH_BACKGROUND = '#1E2D3B';

const hideNativeSplash = () => {
  SplashScreen.hideAsync().catch(() => {});
};

/**
 * Splash phía JS: ảnh nền toàn màn hình + logo. Splash native của expo-splash-screen chỉ hiện được
 * logo trên nền một màu, nên ảnh nền phải vẽ ở đây; splash native được giữ cho tới khi ảnh nền tải
 * xong rồi mới ẩn đi.
 */
export function AppSplash() {
  const { s } = useScale();

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/images/splash-screen-background.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        onLoad={hideNativeSplash}
        onError={hideNativeSplash}
      />
      <Image
        source={require('../../assets/logo/logo1_white.png')}
        style={{ width: s(280), height: s(112) }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
  },
});
