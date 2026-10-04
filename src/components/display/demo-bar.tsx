import { Button } from '@ant-design/react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDisplay } from '@/src/display/display-store';
import { usePairing } from '@/src/pairing/pairing-store';
import { Txt } from '../ui/txt';

/**
 * Thanh điều khiển DEMO — chỉ để dev/QA đẩy sự kiện giả. Khách không thấy: bấm giữ ~1 giây ở góc
 * trên-trái để bật/tắt. Bản chạy thật (Socket.IO) bỏ component này.
 */
export function DemoBar() {
  const { t } = useTranslation();
  const { state, demo } = useDisplay();
  const { state: pairing, demo: pairDemo } = usePairing();
  const [open, setOpen] = useState(false);

  type DemoButton = { label: string; onPress: () => void; disabled?: boolean };
  // chưa ghép: chỉ giả lập được các bước ghép; đã ghép: giả lập luồng bán hàng + thu hồi màn hình
  const pairingButtons: DemoButton[] =
    pairing.status === 'unpaired'
      ? [
          { label: t('display.demo.posEntersCode'), onPress: pairDemo.posEntersCode, disabled: !pairing.code },
          { label: t('display.demo.expireCode'), onPress: pairDemo.expireCode, disabled: !pairing.code },
          {
            label: pairDemo.offline ? t('display.demo.goOnline') : t('display.demo.goOffline'),
            onPress: pairDemo.toggleOffline,
          },
        ]
      : [{ label: t('display.demo.revoke'), onPress: pairDemo.revoke, disabled: pairing.status !== 'paired' }];
  const saleButtons: DemoButton[] = [
    { label: t('display.demo.addLine'), onPress: demo.addSampleLine, disabled: state.screen === 'qr' },
    { label: t('display.demo.removeLine'), onPress: demo.removeLastLine, disabled: !state.cart.lines.length },
    { label: t('display.demo.startQr'), onPress: demo.startQr, disabled: !state.cart.lines.length },
    { label: t('display.demo.expire'), onPress: demo.expireNow, disabled: state.screen !== 'qr' },
    { label: t('display.demo.paid'), onPress: demo.markPaid, disabled: !state.payment },
    { label: t('display.demo.cancel'), onPress: demo.cancelPayment, disabled: !state.payment },
    { label: t('display.demo.clear'), onPress: demo.clear },
  ];
  const buttons = pairing.status === 'paired' ? [...saleButtons, ...pairingButtons] : pairingButtons;
  const current = pairing.status === 'paired' ? state.screen : pairing.status;

  return (
    <>
      <Pressable
        accessibilityLabel="demo-toggle"
        delayLongPress={1000}
        onLongPress={() => setOpen((v) => !v)}
        style={styles.hotspot}
      />
      {open ? (
        <View style={styles.bar}>
          <Txt color="#fff" variant="label">
            {t('display.demo.title')} · {current}
          </Txt>
          <View style={styles.buttons}>
            {buttons.map((b) => (
              <Button key={b.label} size="small" type="ghost" disabled={b.disabled} onPress={b.onPress} style={styles.btn}>
                {b.label}
              </Button>
            ))}
            <Button size="small" type="primary" onPress={() => setOpen(false)} style={styles.btnClose}>
              {t('display.demo.close')}
            </Button>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hotspot: { position: 'absolute', top: 0, left: 0, width: 72, height: 72 },
  bar: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    right: 16,
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { backgroundColor: '#fff', borderRadius: 8 },
  btnClose: { borderRadius: 8, borderColor: '#fff' },
});
