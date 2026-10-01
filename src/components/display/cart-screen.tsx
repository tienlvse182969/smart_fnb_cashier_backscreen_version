import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { formatVnd } from '@/src/data/format';
import type { CartSnapshot, DisplayLine } from '@/src/display/types';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useAppTheme } from '@/src/theme/use-theme';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';

/**
 * Chỉ in đậm tuỳ chọn khác mặc định (mục 12.4); Size đã hiện thành khung bên cạnh tên món.
 * Không lồng Text trong Text: global-font bọc style thành mảng, span lồng nhau trên web không nhận.
 */
function OptionsLine({ line, size }: { line: DisplayLine; size: number }) {
  const shown = line.options.filter((o) => o.groupLabel !== 'Size');
  if (!shown.length) return null;
  const ordered = [...shown.filter((o) => !o.isDefault), ...shown.filter((o) => o.isDefault)];
  return (
    <View style={styles.options}>
      {ordered.map((o, i) => (
        <Txt
          key={o.groupLabel + o.label}
          muted={o.isDefault}
          style={{
            fontSize: size,
            lineHeight: Math.round(size * 1.4),
            fontFamily: o.isDefault ? fontFamily.regular : fontFamily.bold,
          }}>
          {o.label}
          {i < ordered.length - 1 ? '  ·  ' : ''}
        </Txt>
      ))}
    </View>
  );
}

function LineRow({ line }: { line: DisplayLine }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  return (
    <Animated.View entering={FadeInDown.duration(420)} layout={LinearTransition.duration(260)}>
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.border_color_thin, paddingVertical: s(18), gap: s(20) },
        ]}>
      <View style={[styles.qty, { width: s(56), height: s(56), borderColor: theme.border_color_base }]}>
        <Txt style={{ fontFamily: fontFamily.black, fontSize: s(26), lineHeight: s(32) }}>{line.qty}</Txt>
      </View>
      <View style={{ flex: 1, gap: s(4) }}>
        <View style={[styles.nameRow, { gap: s(12) }]}>
          <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(26), lineHeight: s(32) }} numberOfLines={1}>
            {line.name}
          </Txt>
          {line.sizeLabel ? (
            <View style={[styles.sizeTag, { borderColor: theme.border_color_base, paddingHorizontal: s(10) }]}>
              <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(15), lineHeight: s(22) }}>{line.sizeLabel}</Txt>
            </View>
          ) : null}
        </View>
        <OptionsLine line={line} size={s(16)} />
        {line.note ? (
          <Txt muted style={{ fontSize: s(15), lineHeight: s(22), fontStyle: 'italic' }}>
            {t('display.cart.note', { note: line.note })}
          </Txt>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', minWidth: s(130) }}>
        <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(26), lineHeight: s(32) }}>
          {formatVnd(line.qty * line.unitPrice)}
        </Txt>
        {line.qty > 1 ? (
          <Txt muted style={{ fontSize: s(14), lineHeight: s(20) }}>
            {line.qty} × {formatVnd(line.unitPrice)}
          </Txt>
        ) : null}
      </View>
      </View>
    </Animated.View>
  );
}

/**
 * Giỏ hàng thời gian thực (CS-01): hiện món khách đã yêu cầu thêm vào đơn trước khi thanh toán.
 * Trái = danh sách món; phải = tổng tiền cỡ lớn.
 */
export function CartScreen({ cart }: { cart: CartSnapshot }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  const scroll = useRef<ScrollView>(null);
  const cups = cart.lines.reduce((sum, l) => sum + l.qty, 0);

  // thêm món mới thì cuộn xuống để khách luôn thấy dòng vừa thêm
  useEffect(() => {
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(id);
  }, [cart.version]);

  return (
    <View style={[styles.root, { backgroundColor: theme.fill_base }]}>
      <View style={styles.left}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: s(48), paddingVertical: s(28), borderBottomColor: theme.border_color_base },
          ]}>
          <Icon name="cart" size={s(34)} />
          <Txt style={{ fontFamily: fontFamily.black, fontSize: s(38), lineHeight: s(46) }}>
            {t('display.cart.title')}
          </Txt>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: s(48), paddingBottom: s(32) }}>
          {cart.lines.map((line) => (
            <LineRow key={line.id} line={line} />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.right, { width: '36%', padding: s(48) }]}>
        <Image
          source={require('../../../assets/logo/logo1_white.png')}
          style={{ width: s(120), height: s(48), alignSelf: 'flex-start' }}
          contentFit="contain"
        />
        <View style={{ gap: s(8) }}>
          <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(20), lineHeight: s(28) }}>
            {t('display.cart.total')}
          </Txt>
          <Txt
            color={theme.color_text_base_inverse}
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ fontFamily: fontFamily.black, fontSize: s(76), lineHeight: s(88) }}>
            {formatVnd(cart.total)}
          </Txt>
          <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(18), lineHeight: s(26) }}>
            {t('display.cart.count', { lines: cart.lines.length, cups })}
          </Txt>
        </View>
        <View style={[styles.hint, { gap: s(14), paddingTop: s(24) }]}>
          <Icon name="hourglass" size={s(26)} color={theme.color_text_base_inverse} />
          <Txt color={theme.color_text_base_inverse} muted style={{ flex: 1, fontSize: s(17), lineHeight: s(25) }}>
            {t('display.cart.hint')}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  left: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  qty: { borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  sizeTag: { borderWidth: 1.5, borderRadius: 6 },
  right: { backgroundColor: '#0A0A0A', justifyContent: 'space-between' },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
});
