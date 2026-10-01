import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

import { useNow } from '@/src/data/use-now';
import { branchName, posters, stationName } from '@/src/display/mock';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { Txt } from '../ui/txt';

const ROTATE_MS = 8000;
const POSTER_RATIO = 2560 / 948;
const paper = '#FFFFFF';

/**
 * Màn hình chờ — lúc không có khách: áp phích/khuyến mãi xoay vòng. Ảnh luôn hiện nguyên khổ
 * (không cắt chữ trên áp phích); phần thừa của màn hình lấp bằng chính ảnh đó làm mờ.
 */
export function IdleScreen() {
  const { t } = useTranslation();
  const { s, width } = useScale();
  const now = useNow(1000);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (posters.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % posters.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const poster = posters[index % posters.length];
  const clock = new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(now).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  // một áp phích duy nhất thì phóng nhẹ chậm để màn hình không "chết"
  const zoom = useSharedValue(1);
  useEffect(() => {
    zoom.value = withRepeat(withTiming(1.035, { duration: 14000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  return (
    <View style={styles.root}>
      <Animated.View key={`bg-${poster.id}`} entering={FadeIn.duration(900)} exiting={FadeOut.duration(900)} style={StyleSheet.absoluteFill}>
        <Image source={poster.source} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={36} />
        <View style={styles.dim} />
      </Animated.View>

      <View style={[styles.posterArea, { paddingBottom: s(112) }]}>
        <View style={{ width, aspectRatio: POSTER_RATIO, overflow: "hidden" }}>
          <Animated.View
            key={`fg-${poster.id}`}
            entering={FadeIn.duration(900)}
            exiting={FadeOut.duration(900)}
            style={[styles.fill, zoomStyle]}>
            <Image source={poster.source} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          </Animated.View>
        </View>
      </View>

      <View style={[styles.band, { height: s(112), paddingHorizontal: s(40) }]}>
        <View style={styles.bandLeft}>
          <Image
            source={require('../../../assets/logo/logo1_white.png')}
            style={{ width: s(120), height: s(48) }}
            contentFit="contain"
          />
          <View style={[styles.divider, { height: s(40), marginHorizontal: s(24) }]} />
          <View>
            <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(22), lineHeight: s(28) }} color={paper}>
              {t('display.idle.welcome')}
            </Txt>
            <Txt style={{ fontSize: s(14), lineHeight: s(20) }} color={paper} muted>
              {branchName} · {stationName}
            </Txt>
          </View>
        </View>
        <View style={styles.bandRight}>
          <Txt style={{ fontFamily: fontFamily.black, fontSize: s(40), lineHeight: s(46) }} color={paper}>
            {clock}
          </Txt>
          <Txt style={{ fontSize: s(14), lineHeight: s(20), textTransform: 'capitalize' }} color={paper} muted>
            {date}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A', overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  posterArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  bandLeft: { flexDirection: 'row', alignItems: 'center' },
  bandRight: { alignItems: 'flex-end' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
});
