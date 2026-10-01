import {
  Check,
  CircleCheck,
  Clock,
  CupSoda,
  Hourglass,
  QrCode,
  Receipt,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  Timer,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import { useAppTheme } from '@/src/theme/use-theme';

export const Icons = {
  brand: UtensilsCrossed,
  cart: ShoppingBag,
  receipt: Receipt,
  payment: ReceiptText,
  check: Check,
  done: CircleCheck,
  qr: QrCode,
  timer: Timer,
  clock: Clock,
  drink: CupSoda,
  hourglass: Hourglass,
  phone: Smartphone,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof Icons;

export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const theme = useAppTheme();
  const Cmp = Icons[name];
  return <Cmp size={size} color={color ?? theme.color_text_base} strokeWidth={strokeWidth} />;
}
