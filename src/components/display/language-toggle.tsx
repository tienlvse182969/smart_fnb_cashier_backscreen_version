import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppLanguage } from '@/src/i18n';
import { fontFamily } from '@/src/theme/typography';
import { useScale } from '@/src/theme/use-scale';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';

const LANGS: { code: AppLanguage; label: string }[] = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
];

/** Ngôn ngữ đang dùng + hàm đổi qua lại Việt ⇄ Anh. */
export function useLanguage() {
  const { i18n } = useTranslation();
  const current: AppLanguage = i18n.language?.startsWith('en') ? 'en' : 'vi';
  const toggle = () => void i18n.changeLanguage(current === 'vi' ? 'en' : 'vi');
  return { current, toggle };
}

/** Hai ô VI / EN, ô đang chọn tô đặc. `fg` = màu chữ/nền ô chọn, `activeFg` = màu chữ trên ô chọn. */
export function LanguageSegments({ fg, activeFg }: { fg: string; activeFg: string }) {
  const { s } = useScale();
  const { current } = useLanguage();
  return (
    <View style={[styles.row, { gap: s(2) }]}>
      {LANGS.map(({ code, label }) => {
        const active = code === current;
        return (
          <View
            key={code}
            style={[
              styles.seg,
              { paddingHorizontal: s(14), paddingVertical: s(6), borderRadius: s(20) },
              active && { backgroundColor: fg },
            ]}>
            <Txt
              color={active ? activeFg : fg}
              style={{ fontFamily: active ? fontFamily.bold : fontFamily.medium, fontSize: s(16), lineHeight: s(22) }}>
              {label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

/** Nút quả địa cầu + VI/EN trên nền tối của màn hình ghép: chạm để đổi Việt ⇄ Anh. */
export function LanguageToggle({ color }: { color: string }) {
  const { t } = useTranslation();
  const { s } = useScale();
  const { toggle } = useLanguage();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('display.pairing.language')}
      onPress={toggle}
      style={({ pressed }) => [
        styles.pill,
        { gap: s(10), paddingLeft: s(14), paddingRight: s(6), paddingVertical: s(6), opacity: pressed ? 0.7 : 1 },
      ]}>
      <Icon name="globe" size={s(22)} color={color} />
      <LanguageSegments fg={color} activeFg="#0A0A0A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  seg: { overflow: 'hidden' },
});
