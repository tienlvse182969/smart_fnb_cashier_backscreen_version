import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { DisplaySnapshot } from '@/src/services/display-api';
import { toCart } from './mappers';
import type { DisplayEvent, DisplayState } from './types';

const initialState: DisplayState = { screen: 'idle', version: -1, cart: { version: -1, lines: [], total: 0 } };

/** Dựng màn hình từ snapshot của POS (IDLE → CART → PAYMENT_QR → PAID). */
function fromSnapshot(state: DisplayState, snapshot: DisplaySnapshot, version: number): DisplayState {
  const cart = toCart(snapshot, version);
  const base = { version, cart, pending: undefined };
  switch (snapshot.state) {
    case 'IDLE':
      return { ...base, screen: 'idle' };
    case 'PAYMENT_QR': {
      if (!snapshot.qrCode || !snapshot.qrExpiresAt) break;
      const sameQr = state.payment?.qrCode === snapshot.qrCode;
      return {
        ...base,
        // mã đã hết hạn trên máy mà POS chưa kịp gửi bản mới thì giữ màn hình "hết hạn"
        screen: sameQr && state.screen === 'expired' ? 'expired' : 'qr',
        payment: {
          orderCode: snapshot.orderCode ?? '',
          amount: snapshot.totalAmount,
          qrCode: snapshot.qrCode,
          expiresAt: Date.parse(snapshot.qrExpiresAt),
          issuedAt: sameQr && state.payment ? state.payment.issuedAt : Date.now(),
        },
      };
    }
    case 'PAID':
      return {
        ...base,
        screen: 'paid',
        paid: { orderCode: snapshot.orderCode, amount: snapshot.totalAmount, callNumber: snapshot.callNumber },
      };
  }
  // CART, PAYMENT_PENDING (đã chốt đơn, chưa chọn cách trả) và QR thiếu dữ liệu → hiện giỏ
  return { ...base, screen: cart.lines.length ? 'cart' : 'idle' };
}

/**
 * Reducer theo đặc tả 11.11 / BR-46:
 * - snapshot có số phiên bản lớn nhất thắng, bản cũ hơn bị bỏ (gói tin đến trễ không làm sai);
 * - đang báo "Thanh toán thành công" thì giỏ rỗng chỉ được ghi nhớ cho tới hết giờ giữ màn hình,
 *   còn giỏ có món (khách tiếp theo) thì chuyển ngay.
 */
export function displayReducer(state: DisplayState, event: DisplayEvent): DisplayState {
  switch (event.type) {
    case 'display:snapshot': {
      if (event.version <= state.version) return state;
      const { snapshot } = event;
      const nextCustomer = snapshot.state === 'CART' && snapshot.items.length > 0;
      if (state.screen === 'paid' && snapshot.state !== 'PAID' && !nextCustomer) {
        return { ...state, version: event.version, pending: snapshot };
      }
      return fromSnapshot(state, snapshot, event.version);
    }
    case 'display:reset':
      return initialState;
    case 'payment:expired':
      if (state.payment?.orderCode !== event.orderCode || state.screen !== 'qr') return state;
      return { ...state, screen: 'expired' };
    case 'paid:dismiss':
      if (state.screen !== 'paid') return state;
      return state.pending
        ? fromSnapshot(state, state.pending, state.version)
        : { ...state, screen: 'idle', cart: { ...state.cart, lines: [], total: 0 }, paid: undefined };
  }
}

type Ctx = { state: DisplayState; dispatch: (e: DisplayEvent) => void };

const DisplayContext = createContext<Ctx | null>(null);

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(displayReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay(): Ctx {
  const ctx = useContext(DisplayContext);
  if (!ctx) throw new Error('useDisplay must be used inside <DisplayProvider>');
  return ctx;
}
