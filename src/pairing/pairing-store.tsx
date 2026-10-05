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

import { createPairingCode, fetchDisplayContext } from '@/src/services/display-api';
import { clearPairedDevice, loadPairedDevice, savePairedDevice } from './device-storage';
import type { PairedDevice, PairingEvent, PairingState } from './types';

/** Mã ghép hết hạn sau 5 phút (BR-45); hết hạn thì màn hình tự xin mã mới. */
export const PAIRING_CODE_TTL_MS = 5 * 60_000;
/** Chưa kết nối được server thì thử lại — mục 18 yêu cầu tự kết nối lại trong ≤ 10 giây. */
const RETRY_MS = 3_000;
/** Server không đẩy "đã ghép" xuống màn hình → hỏi lại bằng token đi kèm mã. */
const PAIRED_POLL_MS = 2_500;
/** Giữ màn hình "Đã ghép" vài giây cho thu ngân kịp nhìn rồi mới về màn hình chờ. */
const PAIRED_HOLD_MS = 3_500;

const unpaired = (revoked: boolean): PairingState => ({ status: 'unpaired', offline: false, revoked });

export function pairingReducer(state: PairingState, event: PairingEvent): PairingState {
  switch (event.type) {
    case 'restored':
      return event.device ? { status: 'paired', device: event.device, justPaired: false } : unpaired(false);
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
    case 'display:unpaired':
      return unpaired(false);
    case 'display:revoked':
      return unpaired(true);
  }
}

type Ctx = {
  state: PairingState;
  /** xoá ghép trên máy này rồi xin mã mới */
  unpair: () => Promise<void>;
  /** server không nhận token nữa → xoá token, báo "đã được gỡ khỏi quầy" */
  revoke: () => Promise<void>;
};

const PairingContext = createContext<Ctx | null>(null);

export function PairingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pairingReducer, { status: 'loading' });
  const [attempt, setAttempt] = useState(0);

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

  // chưa ghép và chưa có mã → xin mã; lỗi thì thử lại sau RETRY_MS
  const needCode = state.status === 'unpaired' && !state.code;
  useEffect(() => {
    if (!needCode) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    createPairingCode()
      .then((res) => {
        if (cancelled) return;
        dispatch({
          type: 'pair:code',
          code: { code: res.code, deviceToken: res.deviceToken, expiresAt: Date.parse(res.expiresAt) },
        });
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
  const code = state.status === 'unpaired' ? state.code : undefined;
  useEffect(() => {
    if (!code) return;
    const id = setTimeout(() => dispatch({ type: 'pair:requesting' }), Math.max(0, code.expiresAt - Date.now()));
    return () => clearTimeout(id);
  }, [code]);

  // đang hiện mã → hỏi server xem thu ngân đã nhập mã chưa (403 = chưa)
  const pendingToken = code?.deviceToken;
  useEffect(() => {
    if (!pendingToken) return;
    let busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const context = await fetchDisplayContext(pendingToken);
        const device: PairedDevice = {
          token: pendingToken,
          stationId: context.station.id,
          stationName: context.station.name,
          branchName: context.branch.name,
          branding: context.branding,
          pairedAt: Date.now(),
        };
        await savePairedDevice(device).catch(() => {});
        dispatch({ type: 'pair:success', device });
      } catch {
        // 403 = thu ngân chưa nhập mã; lỗi mạng thì lần sau hỏi lại
      } finally {
        busy = false;
      }
    };
    const id = setInterval(() => void check(), PAIRED_POLL_MS);
    return () => clearInterval(id);
  }, [pendingToken]);

  const justPaired = state.status === 'paired' && state.justPaired;
  useEffect(() => {
    if (!justPaired) return;
    const id = setTimeout(() => dispatch({ type: 'pair:settled' }), PAIRED_HOLD_MS);
    return () => clearTimeout(id);
  }, [justPaired]);

  const unpair = useCallback(async () => {
    await clearPairedDevice().catch(() => {});
    dispatch({ type: 'display:unpaired' });
  }, []);

  const revoke = useCallback(async () => {
    await clearPairedDevice().catch(() => {});
    dispatch({ type: 'display:revoked' });
  }, []);

  const value = useMemo(() => ({ state, unpair, revoke }), [state, unpair, revoke]);
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
