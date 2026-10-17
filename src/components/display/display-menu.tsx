import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useDisplay } from '@/src/display/display-store';
import { usePairing } from '@/src/pairing/pairing-store';
import { fontFamily } from '@/src/theme/typography';
import { useScale } from '@/src/theme/use-scale';
import { useAppTheme } from '@/src/theme/use-theme';
import { AppModal } from '../ui/app-modal';
import { Icon, type IconName } from '../ui/icon';
import { Txt } from '../ui/txt';
import { LanguageSegments, useLanguage } from './language-toggle';

/** Đủ lâu để khách vô tình chạm vào góc màn hình không mở được menu. */
const HOLD_MS = 3_000;
/** Chỉ dẫn chạm giữ chỉ hiện một lúc sau khi ghép xong — để thu ngân biết cách mở menu, không phơi cho khách. */
const HINT_MS = 5_000;

/** Khung chỉ dẫn ở góc trên-trái: vòng tròn nhịp đập đúng vị trí cần chạm giữ + dòng chữ. */
function MenuHint() {
  const { t } = useTranslation();
  const { s } = useScale();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false);
  }, [pulse]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.value),
    transform: [{ scale: 0.6 + pulse.value * 0.9 }],
  }));

  const spot = s(72);
  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(500)}
      style={[styles.hint, { top: s(12), left: s(12), gap: s(14) }]}>
      <View style={{ width: spot, height: spot, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[styles.ring, { width: spot * 0.8, height: spot * 0.8, borderRadius: spot }, ringStyle]}
        />
        <View style={[styles.dot, { width: s(18), height: s(18) }]} />
      </View>
      <View style={[styles.bubble, { paddingHorizontal: s(18), paddingVertical: s(10), borderRadius: s(12), gap: s(10) }]}>
        <Icon name="monitor" size={s(22)} color="#FFFFFF" />
        <Txt color="#FFFFFF" style={{ fontFamily: fontFamily.medium, fontSize: s(17), lineHeight: s(24) }}>
          {t('display.menu.hint')}
        </Txt>
      </View>
    </Animated.View>
  );
}

/** Một dòng của menu: icon + tên (+ mô tả) bên trái, phần điều khiển bên phải. */
function MenuRow({
  icon,
  label,
  description,
  onPress,
  right,
}: {
  icon: IconName;
  label: string;
  description?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const theme = useAppTheme();
  const { s } = useScale();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.menuRow,
        {
          gap: s(16),
          paddingHorizontal: s(18),
          paddingVertical: s(16),
          borderRadius: s(12),
          borderColor: theme.border_color_thin,
          backgroundColor: pressed ? theme.fill_tap : theme.fill_base,
        },
      ]}>
      <Icon name={icon} size={s(26)} />
      <View style={{ flex: 1 }}>
        <Txt style={{ fontFamily: fontFamily.medium, fontSize: s(18), lineHeight: s(26) }}>{label}</Txt>
        {description ? (
          <Txt muted style={{ fontSize: s(14), lineHeight: s(20) }}>
            {description}
          </Txt>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

/**
 * Menu thu ngân trên máy này: nhấn giữ góc trên-trái 3 giây → menu gồm đổi ngôn ngữ hiển thị và xoá ghép đôi.
 * Xoá ghép chỉ xoá token trên máy; thiết bị cũ trên server bị gỡ khi ghép máy mới vào quầy hoặc khi Manager thu hồi.
 */
export function DisplayMenu() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { s } = useScale();
  const { state, unpair } = usePairing();
  const { state: display } = useDisplay();
  const { toggle: toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hintOn, setHintOn] = useState(false);

  // vừa ghép xong (màn "Đã ghép" kết thúc) → hiện chỉ dẫn một lúc trên màn hình áp phích
  const justPaired = state.status === 'paired' && state.justPaired;
  const wasJustPaired = useRef(false);
  useEffect(() => {
    if (justPaired) {
      wasJustPaired.current = true;
      return;
    }
    if (!wasJustPaired.current) return;
    wasJustPaired.current = false;
    if (state.status !== 'paired') return;
    setHintOn(true);
    const id = setTimeout(() => setHintOn(false), HINT_MS);
    return () => clearTimeout(id);
  }, [justPaired, state.status]);

  // mở menu thì chỉ dẫn đã hết nhiệm vụ; xoá ghép xong cũng không còn gì để chỉ
  useEffect(() => {
    if (menuOpen || state.status !== 'paired') setHintOn(false);
  }, [menuOpen, state.status]);

  if (state.status !== 'paired') return null;
  const { stationName, branchName } = state.device;
  const showHint = hintOn && !justPaired && display.screen === 'idle';

  return (
    <>
      {showHint ? <MenuHint /> : null}
      <Pressable
        accessibilityLabel={t('display.menu.title')}
        delayLongPress={HOLD_MS}
        onLongPress={() => setMenuOpen(true)}
        style={[styles.hotspot, { width: s(72), height: s(72) }]}
      />

      <AppModal
        visible={menuOpen}
        icon="monitor"
        title={t('display.menu.title')}
        onClose={() => setMenuOpen(false)}
        actions={[{ text: t('display.menu.close'), onPress: () => setMenuOpen(false) }]}>
        <MenuRow
          icon="globe"
          label={t('display.menu.language')}
          onPress={toggleLanguage}
          right={<LanguageSegments fg={theme.color_text_base} activeFg={theme.color_text_base_inverse} />}
        />
        <MenuRow
          icon="unpair"
          label={t('display.menu.unpair')}
          description={t('display.menu.unpairDesc')}
          onPress={() => {
            setMenuOpen(false);
            setConfirmOpen(true);
          }}
        />
      </AppModal>

      <AppModal
        visible={confirmOpen}
        icon="unpair"
        title={t('display.unpair.title')}
        onClose={() => setConfirmOpen(false)}
        actions={[
          { text: t('display.unpair.cancel'), onPress: () => setConfirmOpen(false) },
          {
            text: t('display.unpair.confirm'),
            primary: true,
            onPress: () => {
              setConfirmOpen(false);
              void unpair();
            },
          },
        ]}>
        <Txt muted style={{ textAlign: 'center', fontSize: s(17), lineHeight: s(26) }}>
          {t('display.unpair.message', { station: stationName, branch: branchName })}
        </Txt>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  hotspot: { position: 'absolute', top: 0, left: 0 },
  hint: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  ring: { position: 'absolute', borderWidth: 2, borderColor: '#FFFFFF' },
  dot: { borderRadius: 999, backgroundColor: '#FFFFFF' },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});
