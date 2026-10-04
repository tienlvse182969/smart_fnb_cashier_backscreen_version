import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { branchName, stationName } from '@/src/display/mock';
import { clearPairedDevice, loadPairedDevice, savePairedDevice } from './device-storage';
import type { PairedDevice, PairingCode, PairingEvent, PairingState } from './types';

/** Mã ghép hết hạn sau 5 phút (BR-45); hết hạn thì màn hình tự xin mã mới. */
export const PAIRING_CODE_TTL_MS = 5 * 60_000;
/** Chưa kết nối được server thì thử lại — mục 18 yêu cầu tự kết nối lại trong ≤ 10 giây. */
const RETRY_MS = 3_000;
/** Giữ màn hình "Đã ghép" vài giây cho thu ngân kịp nhìn rồi mới về màn hình chờ. */
const PAIRED_HOLD_MS = 3_500;

export function pairingReducer(state: PairingState, event: PairingEvent): PairingState {
  switch (event.type) {
    case 'restored':
      return event.device
        ? { status: 'paired', device: event.device, justPaired: false }
        : { status: 'unpaired', offline: false, revoked: false };
    case 'pair:requesting':
      return state.status === 'unpaired' ? { ...state, code: undefined } : state;
    case 'pair:offline':
      return state.status === 'unpaired' ? { ...state, code: undefined, offline: true } : state;
    case 'pair:code':
      return state.status === 'unpaired' ? { ...state, code: event.code, offline: false } : state;
    case 'pair:success':
      return { status: 'paired', device: event.device, justPaired: true };
    case 'pair:settled':
      return state.status === 'paired' ? { ...state, justPaired: false } : state;
    case 'display:revoked':
      return { status: 'unpaired', offline: false, revoked: true };
  }
}

/*
 * Mock của server. Bản thật: kết nối Socket.IO không kèm token, `emit('pair:request')` rồi nghe
 * `pair:code`; `pair:success` và `display:revoked` cũng đến qua socket đó. Mã do server sinh bằng
 * bộ sinh số ngẫu nhiên an toàn — Math.random ở đây chỉ để demo.
 */
let mockOffline = false;

function requestCode(): Promise<PairingCode> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (mockOffline) {
        reject(new Error('offline'));
        return;
      }
      resolve({
        code: String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0'),
        expiresAt: Date.now() + PAIRING_CODE_TTL_MS,
      });
    }, 450),
  );
}

type Demo = {
  /** giả lập thu ngân nhập đúng mã trên POS → server gửi `pair:success` */
  posEntersCode: () => void;
  expireCode: () => void;
  toggleOffline: () => void;
  offline: boolean;
  /** giả lập Manager thu hồi màn hình → server gửi `display:revoked` */
  revoke: () => void;
};

type Ctx = { state: PairingState; demo: Demo };

const PairingContext = createContext<Ctx | null>(null);

export function PairingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pairingReducer, { status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [offline, setOffline] = useState(mockOffline);

  // mở app: có token đã lưu thì vào thẳng quầy, không phải ghép lại
  useEffect(() => {
    let active = true;
    loadPairedDevice().then((device) => {
      if (active) dispatch({ type: 'restored', device });
    });
    return () => {
      active = false;
    };
  }, []);

  // chưa ghép và chưa có mã → xin mã; lỗi mạng thì thử lại sau RETRY_MS
  const needCode = state.status === 'unpaired' && !state.code;
  useEffect(() => {
    if (!needCode) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    requestCode()
      .then((code) => {
        if (!cancelled) dispatch({ type: 'pair:code', code });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: 'pair:offline' });
        retry = setTimeout(() => setAttempt((n) => n + 1), RETRY_MS);
      });
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [needCode, attempt]);

  // mã hết hạn → bỏ mã cũ, effect trên tự xin mã mới
  const expiresAt = state.status === 'unpaired' ? state.code?.expiresAt : undefined;
  useEffect(() => {
    if (!expiresAt) return;
    const id = setTimeout(() => dispatch({ type: 'pair:requesting' }), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(id);
  }, [expiresAt]);

  const justPaired = state.status === 'paired' && state.justPaired;
  useEffect(() => {
    if (!justPaired) return;
    const id = setTimeout(() => dispatch({ type: 'pair:settled' }), PAIRED_HOLD_MS);
    return () => clearTimeout(id);
  }, [justPaired]);

  const completePairing = useCallback(async (device: PairedDevice) => {
    await savePairedDevice(device).catch(() => {});
    dispatch({ type: 'pair:success', device });
  }, []);

  const revoke = useCallback(async () => {
    await clearPairedDevice().catch(() => {});
    dispatch({ type: 'display:revoked' });
  }, []);

  const demo = useMemo<Demo>(
    () => ({
      posEntersCode: () => {
        if (state.status !== 'unpaired' || !state.code) return;
        void completePairing({
          token: `mock-device-token-${Date.now()}`,
          stationId: 'mock-station-1',
          stationName,
          branchName,
          pairedAt: Date.now(),
        });
      },
      expireCode: () => dispatch({ type: 'pair:requesting' }),
      toggleOffline: () => {
        mockOffline = !mockOffline;
        setOffline(mockOffline);
        // xin lại mã ngay để thấy trạng thái mất kết nối / kết nối lại
        dispatch({ type: 'pair:requesting' });
        setAttempt((n) => n + 1);
      },
      offline,
      revoke: () => void revoke(),
    }),
    [state, offline, completePairing, revoke],
  );

  const value = useMemo(() => ({ state, demo }), [state, demo]);
  return <PairingContext.Provider value={value}>{children}</PairingContext.Provider>;
}

export function usePairing(): Ctx {
  const ctx = useContext(PairingContext);
  if (!ctx) throw new Error('usePairing must be used inside <PairingProvider>');
  return ctx;
}

/** Quầy mà màn hình này đang gắn vào; `null` khi chưa ghép. */
export function usePairedDevice(): PairedDevice | null {
  const { state } = usePairing();
  return state.status === 'paired' ? state.device : null;
}
