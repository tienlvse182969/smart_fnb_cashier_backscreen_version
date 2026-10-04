/**
 * Ghép màn hình phía khách với quầy (đặc tả v9.1, mục 11.10, BR-45). Màn hình không đăng nhập
 * tài khoản: nó xin server một mã OTP 6 số, thu ngân nhập mã trên POS, server trả token thiết bị
 * về đúng kết nối đã xin mã. Tên sự kiện khớp bảng sự kiện ở 11.11.
 */

/** `pair:code` — thời điểm hết hạn là mốc tuyệt đối (epoch ms). */
export type PairingCode = {
  code: string;
  expiresAt: number;
};

/** Thông tin lưu trên máy sau khi ghép; mở lại app thì dùng lại, không phải ghép lại. */
export type PairedDevice = {
  token: string;
  stationId: string;
  stationName: string;
  branchName: string;
  pairedAt: number;
};

export type PairingEvent =
  | { type: 'restored'; device: PairedDevice | null }
  | { type: 'pair:requesting' }
  | { type: 'pair:offline' }
  | { type: 'pair:code'; code: PairingCode }
  | { type: 'pair:success'; device: PairedDevice }
  | { type: 'pair:settled' }
  | { type: 'display:revoked' };

export type PairingState =
  /** đang đọc token đã lưu — chưa vẽ gì để khỏi nháy màn hình ghép */
  | { status: 'loading' }
  | {
      status: 'unpaired';
      code?: PairingCode;
      /** chưa kết nối được server: màn hình tự thử lại */
      offline: boolean;
      /** vừa bị Manager thu hồi hoặc máy khác ghép vào quầy */
      revoked: boolean;
    }
  /** `justPaired` = đang hiện màn hình "Đã ghép" vài giây trước khi về màn hình chờ */
  | { status: 'paired'; device: PairedDevice; justPaired: boolean };
