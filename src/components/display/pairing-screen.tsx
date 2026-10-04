import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useNow } from '@/src/data/use-now';
import { PAIRING_CODE_TTL_MS } from '@/src/pairing/pairing-store';
import type { PairedDevice, PairingState } from '@/src/pairing/types';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useAppTheme } from '@/src/theme/use-theme';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';

const mmss = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const STEPS = ['step1', 'step2', 'step3'] as const;

/** Sáu ô số cỡ lớn, tách 3 + 3 để thu ngân đọc từ xa. Chưa có mã thì hiện ô trống. */
function CodeBoxes({ code }: { code?: string }) {
  const theme = useAppTheme();
  const { s } = useScale();
  const digits = (code ?? '').padEnd(6, ' ').split('');
  return (
    <View style={[styles.row, { gap: s(14) }]} accessibilityLabel={code ? code.split('').join(' ') : undefined}>
      {digits.map((d, i) => (
        <View
          key={i}
          style={[
            styles.box,
            {
              width: s(96),
              height: s(124),
              borderRadius: s(16),
              marginLeft: i === 3 ? s(22) : 0,
              borderColor: code ? theme.border_color_base : theme.border_color_thin,
            },
          ]}>
          {code ? (
            <Animated.View key={`${code}-${i}`} entering={ZoomIn.duration(260).delay(i * 40)}>
              <Txt style={{ fontFamily: fontFamily.black, fontSize: s(76), lineHeight: s(90) }}>{d}</Txt>
            </Animated.View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Màn hình ghép với quầy (11.10): hiện mã OTP 6 số do server cấp để thu ngân nhập trên POS.
 * Không có nút bấm — khách đứng trước màn hình này cũng không thao tác được gì.
 */
export function PairingScreen({ state }: { state: Extract<PairingState, { status: 'unpaired' }> }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  const now = useNow(250);

  const code = state.code;
  const remaining = code ? code.expiresAt - now : 0;
  const progress = Math.min(1, Math.max(0, remaining / PAIRING_CODE_TTL_MS));
  const fg = theme.color_text_base_inverse;

  return (
    <View style={[styles.root, { backgroundColor: theme.fill_body }]}>
      <View style={[styles.left, { padding: s(48), gap: s(32) }]}>
        {state.revoked ? (
          <View style={[styles.notice, { paddingHorizontal: s(20), paddingVertical: s(12), borderRadius: s(10), gap: s(10) }]}>
            <Icon name="monitor" size={s(22)} color={fg} />
            <Txt color={fg} style={{ fontSize: s(17), lineHeight: s(24) }}>
              {t('display.pairing.revoked')}
            </Txt>
          </View>
        ) : null}

        <View style={{ alignItems: 'center', gap: s(10) }}>
          <View style={[styles.row, { gap: s(14) }]}>
            <Icon name="link" size={s(36)} />
            <Txt style={{ fontFamily: fontFamily.black, fontSize: s(38), lineHeight: s(46) }}>
              {t('display.pairing.title')}
            </Txt>
          </View>
          <Txt muted style={{ fontSize: s(20), lineHeight: s(28) }}>
            {t('display.pairing.subtitle')}
          </Txt>
        </View>

        <CodeBoxes code={code?.code} />

        <View style={{ alignItems: 'center', gap: s(14), minHeight: s(72) }}>
          {code ? (
            <>
              <View style={[styles.row, { gap: s(10) }]}>
                <Icon name="timer" size={s(22)} />
                <Txt style={{ fontSize: s(19), lineHeight: s(26) }}>
                  {t('display.pairing.expiresIn', { time: mmss(remaining) })}
                </Txt>
              </View>
              <View style={[styles.track, { width: s(420), height: s(6), backgroundColor: theme.border_color_thin }]}>
                <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: theme.color_text_base }} />
              </View>
            </>
          ) : state.offline ? (
            <Animated.View entering={FadeIn.duration(250)} style={{ alignItems: 'center', gap: s(6) }}>
              <View style={[styles.row, { gap: s(10) }]}>
                <Icon name="offline" size={s(24)} />
                <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(20), lineHeight: s(28) }}>
                  {t('display.pairing.offline')}
                </Txt>
              </View>
              <Txt muted style={{ fontSize: s(17), lineHeight: s(24) }}>
                {t('display.pairing.retrying')}
              </Txt>
            </Animated.View>
          ) : (
            <View style={[styles.row, { gap: s(12) }]}>
              <ActivityIndicator color={theme.color_text_base} />
              <Txt muted style={{ fontSize: s(19), lineHeight: s(26) }}>
                {t('display.pairing.requesting')}
              </Txt>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.right, { width: '36%', padding: s(48), gap: s(36) }]}>
        <Image
          source={require('../../../assets/logo/logo1_white.png')}
          style={{ width: s(140), height: s(56) }}
          contentFit="contain"
        />
        <View style={{ gap: s(26) }}>
          <Txt color={fg} style={{ fontFamily: fontFamily.bold, fontSize: s(24), lineHeight: s(32) }}>
            {t('display.pairing.howTo')}
          </Txt>
          {STEPS.map((k, i) => (
            <View key={k} style={[styles.step, { gap: s(16) }]}>
              <View style={[styles.stepNo, { width: s(36), height: s(36) }]}>
                <Txt color={fg} style={{ fontFamily: fontFamily.bold, fontSize: s(17), lineHeight: s(22) }}>
                  {i + 1}
                </Txt>
              </View>
              <Txt color={fg} style={{ flex: 1, fontSize: s(19), lineHeight: s(27) }}>
                {t(`display.pairing.${k}`)}
              </Txt>
            </View>
          ))}
        </View>
        <Txt
          color={fg}
          muted
          style={{ fontSize: s(15), lineHeight: s(22), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', paddingTop: s(18) }}>
          {t('display.pairing.note')}
        </Txt>
      </View>
    </View>
  );
}

/** Vừa ghép xong: báo tên quầy vài giây rồi chuyển sang màn hình chờ. */
export function PairedScreen({ device }: { device: PairedDevice }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  const fg = theme.color_text_base_inverse;
  return (
    <View style={[styles.center, { gap: s(16) }]}>
      <Animated.View entering={ZoomIn.duration(380)}>
        <Icon name="paired" size={s(104)} color={fg} strokeWidth={1.6} />
      </Animated.View>
      <Txt color={fg} style={{ fontFamily: fontFamily.black, fontSize: s(52), lineHeight: s(62) }}>
        {t('display.pairing.successTitle')}
      </Txt>
      <Txt color={fg} style={{ fontFamily: fontFamily.bold, fontSize: s(28), lineHeight: s(36) }}>
        {device.stationName} · {device.branchName}
      </Txt>
      <Txt color={fg} muted style={{ fontSize: s(19), lineHeight: s(26), marginTop: s(12) }}>
        {t('display.pairing.successHint')}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  left: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  right: { backgroundColor: '#0A0A0A', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  box: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  track: { borderRadius: 999, overflow: 'hidden' },
  notice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A' },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNo: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0A0A0A' },
});
