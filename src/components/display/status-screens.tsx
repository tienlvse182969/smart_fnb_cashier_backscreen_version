import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatVnd } from '@/src/data/format';
import { useDisplay } from '@/src/display/display-store';
import type { PaidInfo } from '@/src/display/types';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useAppTheme } from '@/src/theme/use-theme';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';

const PAID_HOLD_MS = 8000;

/** QR hết hạn: khách chờ thu ngân tạo mã mới, màn hình phía khách không thao tác được. */
export function ExpiredScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  return (
    <View style={[styles.center, { backgroundColor: theme.fill_body, gap: s(20) }]}>
      <View style={[styles.ring, { width: s(120), height: s(120), borderColor: theme.border_color_base }]}>
        <Icon name="hourglass" size={s(56)} />
      </View>
      <Txt style={{ fontFamily: fontFamily.black, fontSize: s(54), lineHeight: s(64) }}>
        {t('display.expired.title')}
      </Txt>
      <Txt muted style={{ fontSize: s(22), lineHeight: s(30) }}>
        {t('display.expired.hint')}
      </Txt>
    </View>
  );
}

/** Thanh toán thành công — số gọi cỡ lớn; tự về màn hình chờ sau vài giây (đặc tả 4.6). */
export function PaidScreen({ paid }: { paid: PaidInfo }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  const { dispatch } = useDisplay();

  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: 'cart:clear' }), PAID_HOLD_MS);
    return () => clearTimeout(id);
  }, [paid.orderCode, dispatch]);

  const fg = theme.color_text_base_inverse;
  return (
    <View style={[styles.center, { backgroundColor: '#0A0A0A', gap: s(14) }]}>
      <Icon name="done" size={s(96)} color={fg} strokeWidth={1.75} />
      <Txt color={fg} style={{ fontFamily: fontFamily.black, fontSize: s(52), lineHeight: s(62) }}>
        {t('display.paid.title')}
      </Txt>
      <Txt color={fg} muted style={{ fontSize: s(24), lineHeight: s(32), marginTop: s(24) }}>
        {t('display.paid.callNumber')}
      </Txt>
      <Txt color={fg} style={{ fontFamily: fontFamily.black, fontSize: s(220), lineHeight: s(240) }}>
        {String(paid.callNumber).padStart(3, '0')}
      </Txt>
      <Txt color={fg} muted style={{ fontSize: s(22), lineHeight: s(30) }}>
        {t('display.paid.hint')}
      </Txt>
      <Txt color={fg} muted style={{ fontSize: s(18), lineHeight: s(26) }}>
        {t('display.paid.amount', { amount: formatVnd(paid.amount) })}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  ring: { borderWidth: 3, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
