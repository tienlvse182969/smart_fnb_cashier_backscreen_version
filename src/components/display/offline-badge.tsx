import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStationSync } from '@/src/display/station-sync';
import { useScale } from '@/src/theme/use-scale';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';

/** Nhãn nhỏ ở góc khi màn hình mất kết nối với server quá vài giây — giỏ có thể chưa mới nhất. */
export function OfflineBadge() {
  const { t } = useTranslation();
  const { s } = useScale();
  const { offline } = useStationSync();
  if (!offline) return null;
  return (
    <View style={[styles.badge, { top: s(16), right: s(16), gap: s(8), paddingHorizontal: s(14), paddingVertical: s(8) }]}>
      <Icon name="offline" size={s(18)} color="#FFFFFF" />
      <Txt color="#FFFFFF" style={{ fontSize: s(15), lineHeight: s(20) }}>
        {t('display.offline')}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
