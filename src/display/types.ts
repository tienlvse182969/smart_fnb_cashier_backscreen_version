/**
 * Màn hình phía khách (đặc tả v9, mục 4.6, 11.10, 11.11). Chỉ HIỂN THỊ — không thao tác được.
 * Dữ liệu đến từ POS/server qua room `station:{mã quầy}`; bản mock này mô phỏng đúng tên sự kiện
 * để sau này chỉ cần thay nguồn bằng Socket.IO.
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

/** `cart:state` — server luôn gửi cả giỏ, gắn số phiên bản tăng dần theo quầy. */
export type CartSnapshot = {
  version: number;
  lines: DisplayLine[];
  total: number;
};

/** `payment:qr` — thời điểm hết hạn là mốc tuyệt đối (epoch ms), không phải số giây còn lại. */
export type QrPayment = {
  orderCode: number;
  amount: number;
  /** chuỗi QR PayOS trả về; màn hình tự vẽ, không tải ảnh */
  qrCode: string;
  expiresAt: number;
};

/** `payment:paid` */
export type PaidInfo = {
  orderCode: number;
  amount: number;
  callNumber: number;
};

export type DisplayEvent =
  | { type: 'cart:state'; cart: CartSnapshot }
  | { type: 'cart:clear' }
  | { type: 'payment:qr'; payment: QrPayment }
  | { type: 'payment:paid'; paid: PaidInfo }
  | { type: 'payment:expired'; orderCode: number }
  | { type: 'payment:cancelled'; orderCode: number };

export type DisplayScreen = 'idle' | 'cart' | 'qr' | 'expired' | 'paid';

export type DisplayState = {
  screen: DisplayScreen;
  cart: CartSnapshot;
  payment?: QrPayment;
  paid?: PaidInfo;
};
