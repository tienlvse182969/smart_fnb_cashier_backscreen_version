import type { DisplaySnapshot } from '@/src/services/display-api';
import type { CartSnapshot, DisplayLine } from './types';

/**
 * Snapshot của POS chỉ gửi tuỳ chọn dạng chữ (không có nhóm, không biết mặc định hay không) nên
 * hiện tất cả như nhau; size nằm chung trong danh sách tuỳ chọn.
 */
export function toDisplayLine(item: DisplaySnapshot['items'][number]): DisplayLine {
  return {
    id: item.key,
    name: item.name,
    qty: item.quantity,
    unitPrice: item.unitPrice,
    options: item.options.map((label) => ({ groupLabel: '', label, isDefault: true })),
    note: item.note,
  };
}

export function toCart(snapshot: DisplaySnapshot, version: number): CartSnapshot {
  return { version, lines: snapshot.items.map(toDisplayLine), total: snapshot.totalAmount };
}
