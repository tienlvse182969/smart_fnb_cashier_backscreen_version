import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useNow } from '@/src/data/use-now';
import { usePairedDevice } from '@/src/pairing/pairing-store';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { Txt } from '../ui/txt';
import { PosterSlideshow } from './poster-slideshow';

const paper = '#FFFFFF';

/** Màn hình chờ — lúc không có khách: áp phích/khuyến mãi xoay vòng toàn màn hình. */
export function IdleScreen() {
  const { t } = useTranslation();
  const { s } = useScale();
  const device = usePairedDevice();
  const now = useNow(1000);
  const clock = new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(now).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <View style={styles.root}>
      <PosterSlideshow bottomInset={s(112)} />

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
              {device ? `${device.branchName} · ${device.stationName}` : null}
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
