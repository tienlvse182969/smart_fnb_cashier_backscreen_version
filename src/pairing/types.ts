import type { DisplayBranding } from '@/src/services/display-api';

/**
 * Ghép màn hình phía khách với quầy (đặc tả v9.1, mục 11.10, BR-45). Màn hình không đăng nhập
 * tài khoản: nó xin server một mã OTP 6 số kèm token thiết bị; token chỉ dùng được sau khi thu
 * ngân nhập mã trên POS.
 */

/** Mã đang hiện — thời điểm hết hạn là mốc tuyệt đối (epoch ms). */
export type PairingCode = {
  code: string;
  expiresAt: number;
  /** token server cấp cùng mã; dùng để hỏi xem thu ngân đã ghép chưa */
  deviceToken: string;
};

/** Thông tin lưu trên máy sau khi ghép; mở lại app thì dùng lại, không phải ghép lại. */
export type PairedDevice = {
  token: string;
  stationId: string;
  stationName: string;
  branchName: string;
  branding: DisplayBranding;
  pairedAt: number;
};

export type PairingEvent =
  | { type: 'restored'; device: PairedDevice | null }
  | { type: 'pair:requesting' }
  | { type: 'pair:offline' }
  | { type: 'pair:code'; code: PairingCode }
  | { type: 'pair:success'; device: PairedDevice }
  | { type: 'pair:settled' }
  /** xoá ghép ngay trên máy này */
  | { type: 'display:unpaired' }
  /** server không nhận token nữa (Manager thu hồi, máy khác ghép vào quầy, quầy ngừng dùng) */
  | { type: 'display:revoked' };

export type PairingState =
  /** đang đọc token đã lưu — chưa vẽ gì để khỏi nháy màn hình ghép */
  | { status: 'loading' }
  | {
      status: 'unpaired';
      code?: PairingCode;
      /** chưa kết nối được server: màn hình tự thử lại */
      offline: boolean;
      /** vừa bị thu hồi khỏi quầy */
      revoked: boolean;
    }
  /** `justPaired` = đang hiện màn hình "Đã ghép" vài giây trước khi về màn hình chờ */
  | { status: 'paired'; device: PairedDevice; justPaired: boolean };
