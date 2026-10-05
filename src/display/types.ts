import type { DisplaySnapshot } from '@/src/services/display-api';

/**
 * Màn hình phía khách (đặc tả v9.1, mục 4.6, 11.10, 11.11). Chỉ HIỂN THỊ — không thao tác được.
 * Dữ liệu là snapshot POS gửi lên server, server chuyển tới room `station:{mã quầy}`.
 */

/** Tuỳ chọn đã chọn của một món; `isDefault` = tuỳ chọn mặc định (chỉ in đậm cái khác mặc định). */
export type DisplayOption = {
  groupLabel: string;
  label: string;
  isDefault: boolean;
};

export type DisplayLine = {
  id: string;
  name: string;
  sizeLabel?: string;
  qty: number;
  /** giá một ly đã gồm giá cộng thêm của mọi tuỳ chọn */
  unitPrice: number;
  options: DisplayOption[];
  note?: string;
};

/** Giỏ đang hiện — `version` là số phiên bản server cấp theo quầy. */
export type CartSnapshot = {
  version: number;
  lines: DisplayLine[];
  total: number;
};

/** Thời điểm là mốc tuyệt đối (epoch ms), không phải số giây còn lại. */
export type QrPayment = {
  orderCode: string;
  amount: number;
  /** chuỗi QR PayOS trả về; màn hình tự vẽ, không tải ảnh */
  qrCode: string;
  expiresAt: number;
  /** lúc màn hình thấy mã này lần đầu — để vẽ thanh thời gian còn lại */
  issuedAt: number;
};

export type PaidInfo = {
  orderCode?: string;
  amount: number;
  callNumber?: number;
};

export type DisplayEvent =
  /** snapshot mới từ server (context hoặc socket) */
  | { type: 'display:snapshot'; version: number; snapshot: DisplaySnapshot }
  /** ghép quầy mới / xoá ghép — quên số phiên bản của quầy cũ */
  | { type: 'display:reset' }
  /** đồng hồ đếm ngược trên máy về 0 */
  | { type: 'payment:expired'; orderCode: string }
  /** hết thời gian giữ màn hình "Thanh toán thành công" */
  | { type: 'paid:dismiss' };

export type DisplayScreen = 'idle' | 'cart' | 'qr' | 'expired' | 'paid';

export type DisplayState = {
  screen: DisplayScreen;
  /** số phiên bản lớn nhất đã nhận; -1 = chưa nhận gì */
  version: number;
  cart: CartSnapshot;
  payment?: QrPayment;
  paid?: PaidInfo;
  /** snapshot đến trong lúc đang giữ màn hình đã thanh toán — áp dụng khi hết giờ giữ */
  pending?: DisplaySnapshot;
};
