import { Button } from '@ant-design/react-native';
import type { ButtonStyles } from '@ant-design/react-native/lib/button/style';
import { View } from 'react-native';

import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useAppTheme } from '@/src/theme/use-theme';
import { Txt } from './txt';

/**
 * Nút dựng trên antd `Button` — cùng kiểu với `Btn` bên app thu ngân/pha chế (theme B&W, bo 8),
 * nhưng kích thước co giãn theo màn hình tablet phía khách.
 */
export function Btn({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const { s } = useScale();
  const solid = variant === 'primary';
  const fg = solid ? theme.color_text_base_inverse : theme.color_text_base;

  const styles: Partial<ButtonStyles> = {
    wrapperStyle: { borderRadius: s(8) },
    largeRaw: { paddingHorizontal: s(24), minHeight: s(48) },
    ghostRaw: { borderColor: theme.border_color_base },
    ghostDisabledRaw: { borderColor: theme.fill_disabled },
  };

  return (
    <Button
      type={solid ? 'primary' : 'ghost'}
      size="large"
      disabled={disabled}
      onPress={onPress}
      style={{ minWidth: s(120) }}
      styles={styles}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt color={fg} style={{ fontFamily: fontFamily.medium, fontSize: s(17), lineHeight: s(24) }}>
          {label}
        </Txt>
      </View>
    </Button>
  );
}
