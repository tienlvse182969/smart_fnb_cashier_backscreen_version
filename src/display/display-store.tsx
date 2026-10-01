import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { mockQrString, sampleLines } from './mock';
import type { CartSnapshot, DisplayEvent, DisplayState } from './types';

const emptyCart: CartSnapshot = { version: 0, lines: [], total: 0 };

const initialState: DisplayState = { screen: 'idle', cart: emptyCart };

/**
 * Reducer theo đặc tả 11.11:
 * - `cart:state` có số phiên bản lớn nhất thắng, bản cũ hơn bị bỏ (gói tin đến trễ không làm sai);
 * - đang hiện QR hoặc đã trả tiền thì giỏ mới chỉ được ghi nhớ, không đổi màn hình.
 */
export function displayReducer(state: DisplayState, event: DisplayEvent): DisplayState {
  switch (event.type) {
    case 'cart:state': {
      if (event.cart.version <= state.cart.version) return state;
      if (state.screen === 'qr' || state.screen === 'paid') return { ...state, cart: event.cart };
      return {
        screen: event.cart.lines.length ? 'cart' : 'idle',
        cart: event.cart,
      };
    }
    case 'cart:clear':
      return { screen: 'idle', cart: { ...state.cart, lines: [], total: 0 } };
    case 'payment:qr':
      return { ...state, screen: 'qr', payment: event.payment, paid: undefined };
    case 'payment:paid':
      return { ...state, screen: 'paid', paid: event.paid };
    case 'payment:expired':
      if (state.payment?.orderCode !== event.orderCode || state.screen !== 'qr') return state;
      return { ...state, screen: 'expired' };
    case 'payment:cancelled':
      if (state.payment?.orderCode !== event.orderCode) return state;
      return { ...state, screen: state.cart.lines.length ? 'cart' : 'idle', payment: undefined };
  }
}

export const QR_LIFETIME_MS = 5 * 60_000;

type Demo = {
  addSampleLine: () => void;
  removeLastLine: () => void;
  startQr: () => void;
  expireNow: () => void;
  markPaid: () => void;
  cancelPayment: () => void;
  clear: () => void;
};

type Ctx = { state: DisplayState; dispatch: (e: DisplayEvent) => void; demo: Demo };

const DisplayContext = createContext<Ctx | null>(null);

let lineSeq = 0;
let orderSeq = 1042;

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(displayReducer, initialState);

  const pushCart = useCallback(
    (lines: CartSnapshot['lines']) => {
      const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
      dispatch({ type: 'cart:state', cart: { version: state.cart.version + 1, lines, total } });
    },
    [state.cart.version],
  );

  const demo = useMemo<Demo>(
    () => ({
      addSampleLine: () => {
        const base = sampleLines[lineSeq % sampleLines.length];
        const lines = state.cart.lines;
        const same = lines.find((l) => l.name === base.name);
        lineSeq += 1;
        pushCart(
          same
            ? lines.map((l) => (l === same ? { ...l, qty: l.qty + 1 } : l))
            : [...lines, { ...base, id: `l${lineSeq}`, qty: 1 }],
        );
      },
      removeLastLine: () => pushCart(state.cart.lines.slice(0, -1)),
      startQr: () => {
        if (!state.cart.lines.length) return;
        orderSeq += 1;
        dispatch({
          type: 'payment:qr',
          payment: {
            orderCode: orderSeq,
            amount: state.cart.total,
            qrCode: mockQrString(orderSeq, state.cart.total),
            expiresAt: Date.now() + QR_LIFETIME_MS,
          },
        });
      },
      expireNow: () => {
        if (state.payment) dispatch({ type: 'payment:expired', orderCode: state.payment.orderCode });
      },
      markPaid: () => {
        if (!state.payment) return;
        dispatch({
          type: 'payment:paid',
          paid: {
            orderCode: state.payment.orderCode,
            amount: state.payment.amount,
            callNumber: 23,
          },
        });
      },
      cancelPayment: () => {
        if (state.payment) dispatch({ type: 'payment:cancelled', orderCode: state.payment.orderCode });
      },
      clear: () => dispatch({ type: 'cart:clear' }),
    }),
    [state, pushCart],
  );

  const value = useMemo(() => ({ state, dispatch, demo }), [state, demo]);
  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay(): Ctx {
  const ctx = useContext(DisplayContext);
  if (!ctx) throw new Error('useDisplay must be used inside <DisplayProvider>');
  return ctx;
}
