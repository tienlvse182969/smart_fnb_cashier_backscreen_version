import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { usePairedDevice } from '@/src/pairing/pairing-store';
import { PLATFORM_BRAND, resolveBrand, type BrandTokens } from '@/src/theme/brand';

const BrandContext = createContext<BrandTokens>(PLATFORM_BRAND);

/**
 * Nhận diện hiệu lực của màn hình: của chuỗi sau khi ghép quầy, nền tảng khi chưa ghép — nên màn hình xin mã ghép
 * không bị áp nhận diện. Đặt BÊN TRONG `PairingProvider`; nguồn là bản nhận diện lưu cùng thiết bị (mở app lên đúng màu ngay,
 * không đợi mạng) và được `StationSyncProvider` cập nhật mỗi lần hỏi lại server.
 */
export function BrandProvider({ children }: { children: ReactNode }) {
  const device = usePairedDevice();
  const raw = device?.branding;
  const brand = useMemo(() => resolveBrand(raw), [raw]);
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandTokens {
  return useContext(BrandContext);
}
