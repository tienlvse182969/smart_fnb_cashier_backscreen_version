import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { formatVnd } from '@/src/data/format';
import type {
  CartSnapshot,
  DisplayComboPart,
  DisplayLine,
  DisplayOption,
  DisplayTopping,
} from '@/src/display/types';
import { useScale } from '@/src/theme/use-scale';
import { fontFamily } from '@/src/theme/typography';
import { useBrand } from '@/src/branding/brand-context';
import { withAlpha } from '@/src/theme/brand';
import { useAppTheme } from '@/src/theme/use-theme';
import { Icon } from '../ui/icon';
import { Txt } from '../ui/txt';
import { BrandLogo } from './brand-logo';
import { PosterSlideshow } from './poster-slideshow';

const toppingLabel = (t: DisplayTopping) => `+${t.name}${t.qty > 1 ? ` ×${t.qty}` : ''}`;

/**
 * Tuỳ chọn rồi tới topping trên cùng một dòng. Chỉ in đậm tuỳ chọn khác mặc định (mục 12.4);
 * Size đã hiện thành khung bên cạnh tên món.
 * Không lồng Text trong Text: global-font bọc style thành mảng, span lồng nhau trên web không nhận.
 */
function DetailLine({
  options,
  toppings,
  size,
}: {
  options: DisplayOption[];
  toppings: DisplayTopping[];
  size: number;
}) {
  const shown = options.filter((o) => o.groupLabel !== 'Size');
  const ordered = [...shown.filter((o) => !o.isDefault), ...shown.filter((o) => o.isDefault)];
  const parts = [
    ...ordered.map((o) => ({
      key: `o:${o.groupLabel}${o.label}`,
      label: o.label,
      muted: o.isDefault,
      font: o.isDefault ? fontFamily.regular : fontFamily.bold,
    })),
    ...toppings.map((tp) => ({ key: `t:${tp.name}`, label: toppingLabel(tp), muted: false, font: fontFamily.medium })),
  ];
  if (!parts.length) return null;
  return (
    <View style={styles.options}>
      {parts.map((p, i) => (
        <Txt
          key={p.key}
          muted={p.muted}
          style={{ fontSize: size, lineHeight: Math.round(size * 1.4), fontFamily: p.font }}>
          {p.label}
          {i < parts.length - 1 ? '  ·  ' : ''}
        </Txt>
      ))}
    </View>
  );
}

function SizeTag({ label, size }: { label: string; size: number }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.tag, { borderColor: theme.border_color_base, paddingHorizontal: Math.round(size * 0.65) }]}>
      <Txt style={{ fontFamily: fontFamily.bold, fontSize: size, lineHeight: Math.round(size * 1.45) }}>{label}</Txt>
    </View>
  );
}

/** Các món trong combo, mỗi món một dòng kèm size/tuỳ chọn/topping riêng. */
function ComboParts({ parts }: { parts: DisplayComboPart[] }) {
  const theme = useAppTheme();
  const { s } = useScale();
  return (
    <View style={{ gap: s(6), marginTop: s(2), paddingLeft: s(12), borderLeftWidth: 2, borderLeftColor: theme.border_color_base }}>
      {parts.map((p, i) => (
        <View key={`${i}:${p.name}`} style={{ gap: s(2) }}>
          <View style={[styles.nameRow, { gap: s(8) }]}>
            <Txt style={{ flexShrink: 1, fontFamily: fontFamily.medium, fontSize: s(17), lineHeight: s(24) }} numberOfLines={1}>
              {p.qty > 1 ? `${p.qty}× ` : ''}
              {p.name}
            </Txt>
            {p.sizeLabel ? <SizeTag label={p.sizeLabel} size={s(13)} /> : null}
          </View>
          <DetailLine options={p.options} toppings={p.toppings} size={s(14)} />
        </View>
      ))}
    </View>
  );
}

function LineRow({ line }: { line: DisplayLine }) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { s } = useScale();
  const brand = useBrand();
  const isCombo = !!line.comboParts?.length;
  return (
    <Animated.View entering={FadeInDown.duration(420)} layout={LinearTransition.duration(260)}>
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.border_color_thin, paddingVertical: s(16), gap: s(16) },
          // combo cao nhiều dòng: neo số lượng và giá lên đầu dòng thay vì giữa
          isCombo && { alignItems: 'flex-start' },
        ]}>
      <View style={[styles.qty, { width: s(48), height: s(48), borderColor: theme.border_color_base }]}>
        <Txt style={{ fontFamily: fontFamily.black, fontSize: s(22), lineHeight: s(28) }}>{line.qty}</Txt>
      </View>
      <View style={{ flex: 1, gap: s(4) }}>
        <View style={[styles.nameRow, { gap: s(10) }]}>
          <Txt style={{ flexShrink: 1, fontFamily: fontFamily.bold, fontSize: s(22), lineHeight: s(28) }} numberOfLines={1}>
            {line.name}
          </Txt>
          {isCombo ? (
            <View style={[styles.tag, { backgroundColor: brand.primary, borderColor: brand.primary, paddingHorizontal: s(10) }]}>
              <Txt color={brand.primaryContrast} style={{ fontFamily: fontFamily.bold, fontSize: s(13), lineHeight: s(20) }}>
                {t('display.cart.combo')}
              </Txt>
            </View>
          ) : null}
          {line.sizeLabel ? <SizeTag label={line.sizeLabel} size={s(15)} /> : null}
        </View>
        {isCombo ? <ComboParts parts={line.comboParts!} /> : null}
        <DetailLine options={line.options} toppings={line.toppings} size={s(15)} />
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
  const brand = useBrand();
  const onBrand = brand.primaryContrast;
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
          <BrandLogo surface="light" width={s(96)} height={s(38)} />
        </View>

        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: s(32), paddingBottom: s(24) }}>
          {cart.lines.map((line) => (
            <LineRow key={line.id} line={line} />
          ))}
        </ScrollView>

        <View style={{ padding: s(32), gap: s(20), backgroundColor: brand.primary }}>
          <View style={{ gap: s(4) }}>
            <Txt color={onBrand} muted style={{ fontSize: s(18), lineHeight: s(26) }}>
              {t('display.cart.total')}
            </Txt>
            <Txt
              color={onBrand}
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ fontFamily: fontFamily.black, fontSize: s(60), lineHeight: s(70) }}>
              {formatVnd(cart.total)}
            </Txt>
            <Txt color={onBrand} muted style={{ fontSize: s(16), lineHeight: s(24) }}>
              {t('display.cart.count', { lines: cart.lines.length, cups })}
            </Txt>
          </View>
          <View style={[styles.hint, { gap: s(12), paddingTop: s(16), borderTopColor: withAlpha(brand.primaryContrast, 0.25) }]}>
            <Icon name="hourglass" size={s(22)} color={onBrand} />
            <Txt color={onBrand} muted style={{ flex: 1, fontSize: s(15), lineHeight: s(22) }}>
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
  tag: { borderWidth: 1.5, borderRadius: 6 },
  right: {},
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
  },
});
