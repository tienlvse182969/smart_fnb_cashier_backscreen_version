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
import { PosterSlideshow } from './poster-slideshow';

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
          { borderBottomColor: theme.border_color_thin, paddingVertical: s(16), gap: s(16) },
        ]}>
      <View style={[styles.qty, { width: s(48), height: s(48), borderColor: theme.border_color_base }]}>
        <Txt style={{ fontFamily: fontFamily.black, fontSize: s(22), lineHeight: s(28) }}>{line.qty}</Txt>
      </View>
      <View style={{ flex: 1, gap: s(4) }}>
        <View style={[styles.nameRow, { gap: s(10) }]}>
          <Txt style={{ flexShrink: 1, fontFamily: fontFamily.bold, fontSize: s(22), lineHeight: s(28) }} numberOfLines={1}>
            {line.name}
          </Txt>
          {line.sizeLabel ? (
            <View style={[styles.sizeTag, { borderColor: theme.border_color_base, paddingHorizontal: s(10) }]}>
              <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(15), lineHeight: s(22) }}>{line.sizeLabel}</Txt>
            </View>
          ) : null}
        </View>
        <OptionsLine line={line} size={s(15)} />
        {line.note ? (
          <Txt muted style={{ fontSize: s(15), lineHeight: s(22), fontStyle: 'italic' }}>
            {t('display.cart.note', { note: line.note })}
          </Txt>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', minWidth: s(100) }}>
        <Txt style={{ fontFamily: fontFamily.bold, fontSize: s(22), lineHeight: s(28) }}>
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
 * Giỏ hàng thời gian thực (CS-01): hiện món thu ngân đã thêm vào đơn trước khi thanh toán.
 * Trái = áp phích xoay vòng; phải = danh sách món + tổng tiền.
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
        <PosterSlideshow />
      </View>

      <View style={[styles.right, { width: '44%', backgroundColor: theme.fill_base }]}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: s(32), paddingVertical: s(24), borderBottomColor: theme.border_color_base },
          ]}>
          <Icon name="cart" size={s(30)} />
          <Txt style={{ flex: 1, fontFamily: fontFamily.black, fontSize: s(32), lineHeight: s(40) }}>
            {t('display.cart.title')}
          </Txt>
          <Image
            source={require('../../../assets/logo/logo1.png')}
            style={{ width: s(96), height: s(38) }}
            contentFit="contain"
          />
        </View>

        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: s(32), paddingBottom: s(24) }}>
          {cart.lines.map((line) => (
            <LineRow key={line.id} line={line} />
          ))}
        </ScrollView>

        <View style={[styles.summary, { padding: s(32), gap: s(20) }]}>
          <View style={{ gap: s(4) }}>
            <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(18), lineHeight: s(26) }}>
              {t('display.cart.total')}
            </Txt>
            <Txt
              color={theme.color_text_base_inverse}
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ fontFamily: fontFamily.black, fontSize: s(60), lineHeight: s(70) }}>
              {formatVnd(cart.total)}
            </Txt>
            <Txt color={theme.color_text_base_inverse} muted style={{ fontSize: s(16), lineHeight: s(24) }}>
              {t('display.cart.count', { lines: cart.lines.length, cups })}
            </Txt>
          </View>
          <View style={[styles.hint, { gap: s(12), paddingTop: s(16) }]}>
            <Icon name="hourglass" size={s(22)} color={theme.color_text_base_inverse} />
            <Txt color={theme.color_text_base_inverse} muted style={{ flex: 1, fontSize: s(15), lineHeight: s(22) }}>
              {t('display.cart.hint')}
            </Txt>
          </View>
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
  right: {},
  summary: { backgroundColor: '#0A0A0A' },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
});
