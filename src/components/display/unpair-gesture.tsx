import { Modal } from '@ant-design/react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { usePairing } from '@/src/pairing/pairing-store';
import { Txt } from '../ui/txt';

/** Đủ lâu để khách vô tình chạm vào góc màn hình không mở được hộp xoá ghép. */
const HOLD_MS = 3_000;

/**
 * Xoá ghép trên máy này: nhấn giữ góc trên-trái 3 giây → xác nhận. Chỉ xoá token trên máy;
 * thiết bị cũ trên server bị gỡ khi ghép máy mới vào quầy hoặc khi Manager thu hồi.
 */
export function UnpairGesture() {
  const { t } = useTranslation();
  const { state, unpair } = usePairing();
  const [open, setOpen] = useState(false);

  if (state.status !== 'paired') return null;
  const { stationName, branchName } = state.device;

  return (
    <>
      <Pressable
        accessibilityLabel={t('display.unpair.title')}
        delayLongPress={HOLD_MS}
        onLongPress={() => setOpen(true)}
        style={styles.hotspot}
      />
      <Modal
        visible={open}
        transparent
        maskClosable
        title={t('display.unpair.title')}
        onClose={() => setOpen(false)}
        footer={[
          { text: t('display.unpair.cancel'), onPress: () => setOpen(false) },
          {
            text: t('display.unpair.confirm'),
            onPress: () => {
              setOpen(false);
              void unpair();
            },
          },
        ]}>
        <Txt muted style={styles.body}>
          {t('display.unpair.message', { station: stationName, branch: branchName })}
        </Txt>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hotspot: { position: 'absolute', top: 0, left: 0, width: 72, height: 72 },
  body: { textAlign: 'center', paddingVertical: 8 },
});
