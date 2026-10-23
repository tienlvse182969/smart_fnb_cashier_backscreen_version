import { absoluteUrl } from '@/src/display/posters';
import type { DisplayBranding } from '@/src/services/display-api';

/**
 * Nhận diện thương hiệu của chuỗi (OW-07) áp cho màn hình phía khách — cùng quy tắc với web và app Thu ngân/Pha chế:
 * chỉ màu chủ đạo + logo + tên; QR, trạng thái và các lớp phủ trung tính không bao giờ bị ghi đè (BR-42).
 * Màn hình không đăng nhập: nhận diện đi kèm `GET /public/customer-display/context` của quầy đã ghép.
 */

export type BrandTokens = {
  /** Nền các khối "tối" của màn hình (dải đáy màn chờ, tổng tiền, khối QR, màn thanh toán xong). */
  primary: string;
  /** Màu chữ/biểu tượng trên nền `primary`, chọn để đạt tương phản WCAG AA (BR-43). */
  primaryContrast: string;
  displayName: string;
  /** URL tuyệt đối của logo chuỗi; `undefined` = logo nền tảng. */
  logo: string | undefined;
  /** true = nhận diện riêng của chuỗi đang được áp. */
  custom: boolean;
};

/** Bộ mặc định phía backend khi chuỗi chưa cấu hình hoặc sau khi reset (`branding.service.ts`). */
const BE_DEFAULT_PRIMARY = '#0F172A';

/** Nhận diện nền tảng = giao diện đen–trắng sẵn có (trước khi ghép quầy hoặc chuỗi chưa cấu hình). */
export const PLATFORM_BRAND: BrandTokens = {
  primary: '#0A0A0A',
  primaryContrast: '#FFFFFF',
  displayName: '',
  logo: undefined,
  custom: false,
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const toRgb = (hex: string): [number, number, number] => {
  const clean = hex.slice(1);
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const luminance = ([r, g, b]: [number, number, number]) => {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

/** Tỷ lệ tương phản WCAG 2.0 giữa hai màu hex. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(toRgb(a));
  const lb = luminance(toRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Chữ trắng nếu đạt 4.5:1 trên nền `bg`, ngược lại chữ đen. Không từ chối màu Owner chọn, chỉ tự chỉnh màu chữ. */
export function pickReadableTextColor(bg: string): '#FFFFFF' | '#000000' {
  return contrastRatio(bg, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#000000';
}

/** `#RRGGBB`/`#RGB` + độ đục 0–1 → `rgba()`. Dùng cho lớp phủ trong suốt theo màu thương hiệu / màu chữ trên thương hiệu. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

const same = (a: string | undefined, b: string) => (a ?? '').toLowerCase() === b.toLowerCase();

/**
 * Chọn nhận diện hiệu lực. Chưa có dữ liệu, màu không hợp lệ, hoặc dữ liệu mặc định của BE (màu mặc định và không logo)
 * đều trả nhận diện nền tảng (BR-44).
 */
export function resolveBrand(raw: DisplayBranding | null | undefined): BrandTokens {
  if (!raw || !HEX.test(raw.primaryColor)) return PLATFORM_BRAND;
  const logo = absoluteLogoUrl(raw.logoUrl);
  if (!logo && same(raw.primaryColor, BE_DEFAULT_PRIMARY)) return PLATFORM_BRAND;
  return {
    primary: raw.primaryColor,
    primaryContrast: pickReadableTextColor(raw.primaryColor),
    displayName: raw.displayName?.trim() ?? '',
    logo,
    custom: true,
  };
}

const absoluteLogoUrl = (url: string | null | undefined) => (url ? absoluteUrl(url) : undefined);

/** Cùng nội dung → không cập nhật state/lưu lại, để không vẽ lại thừa mỗi 60 giây. */
export function sameBranding(a: DisplayBranding | null | undefined, b: DisplayBranding | null | undefined): boolean {
  if (!a || !b) return a === b;
  return (
    a.displayName === b.displayName &&
    (a.logoUrl ?? null) === (b.logoUrl ?? null) &&
    a.primaryColor.toLowerCase() === b.primaryColor.toLowerCase() &&
    a.secondaryColor.toLowerCase() === b.secondaryColor.toLowerCase() &&
    a.accentColor.toLowerCase() === b.accentColor.toLowerCase()
  );
}
