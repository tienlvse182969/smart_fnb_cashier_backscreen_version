import { Modal } from '@ant-design/react-native';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useAppTheme } from '@/src/theme/use-theme';
import { Btn } from './button';
import { Icon, type IconName } from './icon';
import { Txt } from './txt';

type ModalAction = { text: string; onPress: () => void; primary?: boolean };

/**
 * Modal dựng trên antd `Modal` (transparent) — khung/nội dung tự vẽ để giữ đúng phong cách B&W
 * của app thu ngân/pha chế (`AppModal` bên đó), kích thước co giãn theo tablet.
 */
export function AppModal({
  visible,
  title,
  icon,
  onClose,
  children,
  actions,
}: {
  visible: boolean;
  title: string;
  icon?: IconName;
  onClose: () => void;
  children: ReactNode;
  actions?: ModalAction[];
}) {
  const theme = useAppTheme();
  const { s, width } = useScale();
  const dialogWidth = Math.min(s(560), width - s(48));

  return (
    <Modal
      visible={visible}
      transparent
      maskClosable
      closable={false}
      animationType="fade"
      onClose={onClose}
      onRequestClose={() => {
        onClose();
        return true;
      }}
      style={{
        width: dialogWidth,
        backgroundColor: theme.fill_base,
        borderColor: theme.border_color_thin,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: s(16),
        paddingTop: s(28),
      }}
      bodyStyle={{ paddingHorizontal: s(28), paddingBottom: s(28), paddingTop: 0 }}>
      {icon ? (
        <View style={{ alignItems: 'center', marginBottom: s(12) }}>
          <Icon name={icon} size={s(40)} />
        </View>
      ) : null}
      <Txt
        style={{
          marginBottom: s(14),
          textAlign: 'center',
          fontFamily: fontFamily.semibold,
          fontSize: s(24),
          lineHeight: s(32),
        }}>
        {title}
      </Txt>
      <View style={{ gap: s(10) }}>{children}</View>
      {actions && actions.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: s(12), marginTop: s(24) }}>
          {actions.map((a) => (
            <Btn key={a.text} label={a.text} onPress={a.onPress} variant={a.primary ? 'primary' : 'ghost'} />
          ))}
        </View>
      ) : null}
    </Modal>
  );
}
