import type {
  DisplayDetailOption,
  DisplayDetailTopping,
  DisplaySnapshot,
} from '@/src/services/display-api';
import type { CartSnapshot, DisplayLine, DisplayOption, DisplayTopping } from './types';

const toOptions = (options: DisplayDetailOption[] = []): DisplayOption[] =>
  options.map((o) => ({ groupLabel: '', label: o.label, isDefault: o.isDefault }));

const toToppings = (toppings: DisplayDetailTopping[] = []): DisplayTopping[] =>
  toppings.map((t) => ({ name: t.name, qty: t.quantity }));

/**
 * POS mới gửi kèm `detail` (size, topping, món trong combo). POS bản cũ chỉ gửi tuỳ chọn dạng chữ
 * (không có nhóm, không biết mặc định hay không) nên hiện tất cả như nhau.
 */
export function toDisplayLine(item: DisplaySnapshot['items'][number]): DisplayLine {
  const base = { id: item.key, name: item.name, qty: item.quantity, unitPrice: item.unitPrice, note: item.note };
  const detail = item.detail;
  if (!detail) {
    return {
      ...base,
      options: item.options.map((label) => ({ groupLabel: '', label, isDefault: true })),
      toppings: [],
    };
  }
  if (detail.components?.length) {
    return {
      ...base,
      options: [],
      toppings: [],
      comboParts: detail.components.map((c) => ({
        name: c.name,
        qty: c.quantity,
        sizeLabel: c.size,
        options: toOptions(c.options),
        toppings: toToppings(c.toppings),
      })),
    };
  }
  return {
    ...base,
    sizeLabel: detail.size,
    options: toOptions(detail.options),
    toppings: toToppings(detail.toppings),
  };
}

export function toCart(snapshot: DisplaySnapshot, version: number): CartSnapshot {
  return { version, lines: snapshot.items.map(toDisplayLine), total: snapshot.totalAmount };
}
