import { apiClient } from '@/src/lib/api-client';

/** Trạng thái màn hình khách do POS gửi — giống hệt `DisplaySnapshot` của app thu ngân. */
export type DisplaySnapshotState = 'IDLE' | 'CART' | 'PAYMENT_PENDING' | 'PAYMENT_QR' | 'PAID';

export type DisplaySnapshot = {
  state: DisplaySnapshotState;
  items: {
    key: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    options: string[];
    note?: string;
  }[];
  totalAmount: number;
  orderCode?: string;
  callNumber?: number;
  paymentMethod?: string;
  /** chuỗi QR PayOS — màn hình tự vẽ, không tải ảnh */
  qrCode?: string;
  /** ISO time */
  qrExpiresAt?: string;
};

export type DisplayBranding = {
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export type DisplayContext = {
  station: { id: string; name: string };
  branch: { id: string; name: string };
  currency: string;
  branding: DisplayBranding;
  /** số phiên bản giỏ do server cấp theo quầy (BR-46) */
  version: number;
  snapshot: DisplaySnapshot;
};

export type PairingCodeResponse = {
  pairingId: string;
  code: string;
  /** token thiết bị — chỉ dùng được sau khi thu ngân nhập mã trên POS */
  deviceToken: string;
  /** ISO time */
  expiresAt: string;
};

/** Xin mã ghép 6 số (11.10). Không cần đăng nhập. */
export async function createPairingCode() {
  const { data } = await apiClient.post<PairingCodeResponse>('/device-pairing/codes', {
    deviceType: 'CUSTOMER_DISPLAY',
  });
  return data;
}

/**
 * Quầy đã ghép + trạng thái màn hình hiện tại. Token chưa được ghép, đã bị thu hồi → 403;
 * quầy ngừng dùng → 404.
 */
export async function fetchDisplayContext(deviceToken: string) {
  const { data } = await apiClient.get<DisplayContext>('/public/customer-display/context', {
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return data;
}
