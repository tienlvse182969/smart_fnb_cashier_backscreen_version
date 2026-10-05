import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

import { formatVnd } from '@/src/data/format';
import { useNow } from '@/src/data/use-now';
import { useDisplay } from '@/src/display/display-store';
import type { CartSnapshot, QrPayment } from '@/src/display/types';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useAppTheme } from '@/src/theme/use-theme';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';

const mmss = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const WARN_MS = 30_000;
const MAX_SUMMARY_LINES = 4;

/**
 * Hiện QR thanh toán (CS-03). Đếm ngược theo mốc hết hạn TUYỆT ĐỐI + đồng hồ máy (mục 11.11);
 * bản có backend cộng thêm độ lệch giờ với server. QR tự vẽ từ chuỗi PayOS, không tải ảnh.
 * Không dùng màu để mã hoá trạng thái — sắp hết hạn thì đảo nền đen/chữ trắng và đổi chữ.
 */
export function QrScreen({ payment, cart }: { payment: QrPayment; cart: CartSnapshot }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s, width, height } = useScale();
  const { dispatch } = useDisplay();
  const now = useNow(250);

  const remaining = payment.expiresAt - now;
  const warn = remaining <= WARN_MS;
  const lifetime = Math.max(1, payment.expiresAt - payment.issuedAt);
  const progress = Math.min(1, Math.max(0, remaining / lifetime));

  // về 0 thì tự báo hết hạn; POS huỷ đơn rồi gửi giỏ mới sau đó
  useEffect(() => {
    if (remaining <= 0) dispatch({ type: 'payment:expired', orderCode: payment.orderCode });
  }, [remaining, payment.orderCode, dispatch]);

  const qrSize = Math.round(Math.min(height * 0.62, width * 0.36));
  const shown = cart.lines.slice(0, MAX_SUMMARY_LINES);
  const hidden = cart.lines.length - shown.length;

  return (
    <View style={[styles.root, { backgroundColor: theme.fill_body }]}>
      <View style={[styles.left, { padding: s(48), gap: s(28) }]}>
        <View style={[styles.row, { gap: s(14) }]}>
          <Icon name="qr" size={s(36)} />
          <Txt style={{ fontFamily: fontFamily.black, fontSize: s(38), lineHeight: s(46) }}>
            {t('display.qr.title')}
          </Txt>
        </View>
        <View
          style={[
            styles.qrFrame,
            { borderColor: theme.border_color_base, padding: s(24), borderRadius: s(16) },
          ]}>
          <QRCode value={payment.qrCode} size={qrSize} ecl="M" />
        </View>
        <View style={[styles.row, { gap: s(32) }]}>
          {(['step1', 'step2', 'step3'] as const).map((k, i) => (
            <View key={k} style={[styles.row, { gap: s(10) }]}>
              <View style={[styles.stepNo, { width: s(30), height: s(30), borderColor: theme.border_color_base }]}>
                <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(15), lineHeight: s(20) }}>{i + 1}</Txt>
              </View>
              <Txt style={{ fontSize: s(16), lineHeight: s(22) }}>{t(`display.qr.${k}`)}</Txt>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.right, { width: '40%', padding: s(48), gap: s(24) }]}>
        <View style={{ gap: s(6) }}>
          <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(20), lineHeight: s(28) }}>
            {t('display.qr.amount')}
          </Txt>
          <Txt
            color={theme.color_text_base_inverse}
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ fontFamily: fontFamily.black, fontSize: s(72), lineHeight: s(84) }}>
            {formatVnd(payment.amount)}
          </Txt>
          <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(18), lineHeight: s(26) }}>
            {t('display.qr.orderCode', { code: payment.orderCode })}
          </Txt>
        </View>

        <View
          style={[
            styles.timer,
            {
              padding: s(20),
              borderRadius: s(12),
              gap: s(12),
              backgroundColor: warn ? theme.fill_base : 'transparent',
              borderColor: theme.fill_base,
            },
          ]}>
          <View style={[styles.row, { gap: s(10) }]}>
            <Icon name="timer" size={s(24)} color={warn ? theme.color_text_base : theme.color_text_base_inverse} />
            <Txt
              color={warn ? theme.color_text_base : theme.color_text_base_inverse}
              style={{ fontSize: s(18), lineHeight: s(26) }}>
              {warn ? t('display.qr.expiringSoon') : t('display.qr.expiresIn')}
            </Txt>
          </View>
          <Txt
            color={warn ? theme.color_text_base : theme.color_text_base_inverse}
            style={{ fontFamily: fontFamily.black, fontSize: s(64), lineHeight: s(72) }}>
            {mmss(remaining)}
          </Txt>
          <View style={[styles.track, { height: s(6), backgroundColor: warn ? '#D0D0D0' : 'rgba(255,255,255,0.25)' }]}>
            <View
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                backgroundColor: warn ? theme.color_text_base : theme.fill_base,
              }}
            />
          </View>
        </View>

        <View style={{ gap: s(8), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', paddingTop: s(18) }}>
          {shown.map((l) => (
            <View key={l.id} style={[styles.row, { justifyContent: 'space-between', gap: s(12) }]}>
              <Txt color={theme.color_text_base_inverse} numberOfLines={1} style={{ flex: 1, fontSize: s(17), lineHeight: s(24) }}>
                {l.qty} × {l.name}
                {l.sizeLabel ? ` (${l.sizeLabel})` : ''}
              </Txt>
              <Txt color={theme.color_text_base_inverse} style={{ fontSize: s(17), lineHeight: s(24), fontFamily: fontFamily.medium }}>
                {formatVnd(l.qty * l.unitPrice)}
              </Txt>
            </View>
          ))}
          {hidden > 0 ? (
            <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(15), lineHeight: s(22) }}>
              {t('display.qr.moreLines', { count: hidden })}
            </Txt>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  left: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  right: { backgroundColor: '#0A0A0A', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  qrFrame: { backgroundColor: '#FFFFFF', borderWidth: 3 },
  stepNo: { borderWidth: 1.5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  timer: { borderWidth: 2 },
  track: { borderRadius: 999, overflow: 'hidden' },
});
