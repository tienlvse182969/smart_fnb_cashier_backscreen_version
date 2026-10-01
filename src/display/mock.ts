import type { DisplayLine, DisplayOption } from './types';

export const branchName = 'Chi nhánh Q1 · Nguyễn Huệ';
export const stationName = 'Quầy 1';

export type Poster = {
  id: string;
  source: number;
};

/** Áp phích hiển thị lúc không có khách — thêm ảnh vào mảng này, màn hình chờ tự xoay vòng. */
export const posters: Poster[] = [
  { id: 'matcha', source: require('../../assets/images/apphichmau.jpg') },
];

const opt = (groupLabel: string, label: string, isDefault = true): DisplayOption => ({
  groupLabel,
  label,
  isDefault,
});

type Sample = Omit<DisplayLine, 'id' | 'qty'>;

/** Món mẫu cho DemoBar — tên/giá lấy từ thực đơn mock của app POS. */
export const sampleLines: Sample[] = [
  {
    name: 'Cà phê sữa đá',
    sizeLabel: 'L',
    unitPrice: 35000,
    options: [opt('Size', 'L', false), opt('Đường', '100% đường'), opt('Đá', 'Đá bình thường')],
  },
  {
    name: 'Trà sữa matcha',
    sizeLabel: 'M',
    unitPrice: 43000,
    options: [
      opt('Size', 'M'),
      opt('Đường', '50% đường', false),
      opt('Đá', 'Ít đá', false),
      opt('Topping', 'Trân châu đen', false),
    ],
    note: 'Ít ngọt giúp mình nhé',
  },
  {
    name: 'Trà đào cam sả',
    sizeLabel: 'M',
    unitPrice: 39000,
    options: [opt('Size', 'M'), opt('Đường', '70% đường', false), opt('Đá', 'Đá bình thường')],
  },
  {
    name: 'Bạc xỉu',
    sizeLabel: 'M',
    unitPrice: 32000,
    options: [opt('Size', 'M'), opt('Đường', '100% đường'), opt('Đá', 'Không đá', false)],
  },
  {
    name: 'Bánh mì thịt nướng',
    unitPrice: 33000,
    options: [opt('Thêm', 'Thêm trứng', false)],
  },
  {
    name: 'Cold brew',
    sizeLabel: 'M',
    unitPrice: 45000,
    options: [opt('Size', 'M'), opt('Đường', '0% đường', false), opt('Đá', 'Đá bình thường')],
  },
];

/** Chuỗi QR giả — bản có backend sẽ là chuỗi VietQR do PayOS trả về. */
export const mockQrString = (orderCode: number, amount: number) =>
  `00020101021238570010A000000727012700069704220113VQRQA00000000020208QRIBFTTA53037045405${amount}5802VN62${orderCode}6304ABCD`;
