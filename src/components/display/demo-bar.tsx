import { Button } from '@ant-design/react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDisplay } from '@/src/display/display-store';
import { Txt } from '../ui/txt';

/**
 * Thanh điều khiển DEMO — chỉ để dev/QA đẩy sự kiện giả. Khách không thấy: bấm giữ ~1 giây ở góc
 * trên-trái để bật/tắt. Bản chạy thật (Socket.IO) bỏ component này.
 */
export function DemoBar() {
  const { t } = useTranslation();
  const { state, demo } = useDisplay();
  const [open, setOpen] = useState(false);

  const buttons: { label: string; onPress: () => void; disabled?: boolean }[] = [
    { label: t('display.demo.addLine'), onPress: demo.addSampleLine, disabled: state.screen === 'qr' },
    { label: t('display.demo.removeLine'), onPress: demo.removeLastLine, disabled: !state.cart.lines.length },
    { label: t('display.demo.startQr'), onPress: demo.startQr, disabled: !state.cart.lines.length },
    { label: t('display.demo.expire'), onPress: demo.expireNow, disabled: state.screen !== 'qr' },
    { label: t('display.demo.paid'), onPress: demo.markPaid, disabled: !state.payment },
    { label: t('display.demo.cancel'), onPress: demo.cancelPayment, disabled: !state.payment },
    { label: t('display.demo.clear'), onPress: demo.clear },
  ];

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
            {t('display.demo.title')} · {state.screen}
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
