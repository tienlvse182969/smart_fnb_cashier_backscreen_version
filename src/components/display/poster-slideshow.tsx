import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { posters } from '@/src/display/mock';

const ROTATE_MS = 8000;

/**
 * Áp phích/khuyến mãi xoay vòng, lấp đầy khung cha. Ảnh luôn hiện nguyên khổ (không cắt chữ trên
 * áp phích); phần thừa lấp bằng chính ảnh đó làm mờ. `bottomInset` chừa chỗ cho thanh phủ phía dưới.
 */
export function PosterSlideshow({ bottomInset = 0 }: { bottomInset?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (posters.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % posters.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  // một áp phích duy nhất thì phóng nhẹ chậm để màn hình không "chết"
  const zoom = useSharedValue(1);
  useEffect(() => {
    zoom.value = withRepeat(withTiming(1.035, { duration: 14000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  const poster = posters[index % posters.length];

  return (
    <View style={styles.root}>
      <Animated.View
        key={`bg-${poster.id}`}
        entering={FadeIn.duration(900)}
        exiting={FadeOut.duration(900)}
        style={StyleSheet.absoluteFill}>
        <Image source={poster.source} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={36} />
        <View style={styles.dim} />
      </Animated.View>

      <View style={[styles.posterArea, { paddingBottom: bottomInset }]}>
        <Animated.View
          key={`fg-${poster.id}`}
          entering={FadeIn.duration(900)}
          exiting={FadeOut.duration(900)}
          style={[styles.fill, zoomStyle]}>
          <Image source={poster.source} style={styles.fill} contentFit="contain" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A', overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  posterArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
