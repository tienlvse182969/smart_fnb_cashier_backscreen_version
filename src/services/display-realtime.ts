import { io } from 'socket.io-client';

import { apiOrigin } from '@/src/lib/api-client';
import type { DisplaySnapshot } from './display-api';

/** Bản cập nhật quầy gửi tới room `station:{id}` — snapshot kèm số phiên bản do server cấp. */
export type StationUpdate = { version: number; snapshot: DisplaySnapshot };

type OperationsEvent = {
  type: string;
  data?: Partial<DisplaySnapshot> & { stationId?: string; version?: number };
};

const DISPLAY_EVENTS = new Set(['cart.update', 'cart.clear', 'display.update']);
/** server tự ngắt (token sai/bị thu hồi) thì socket.io không tự nối lại — tự thử lại sau ngần này */
const SERVER_KICK_RETRY_MS = 3_000;

/**
 * Nối màn hình khách vào room của quầy (11.11): namespace `/operations`, xác thực bằng token
 * thiết bị trong `auth`. Trả về hàm ngắt kết nối.
 */
export function connectStation(
  deviceToken: string,
  handlers: {
    onUpdate: (update: StationUpdate) => void;
    /** vừa vào room (kể cả sau khi nối lại) — nên tải lại trạng thái đầy đủ */
    onConnected: () => void;
    /** `kicked` = server chủ động ngắt: token có thể đã bị thu hồi */
    onDisconnected: (kicked: boolean) => void;
  },
) {
  const socket = io(`${apiOrigin()}/operations`, {
    path: process.env.EXPO_PUBLIC_REALTIME_PATH || '/socket.io',
    auth: { token: deviceToken },
    // chỉ websocket, bỏ bước long-polling ban đầu (11.11)
    transports: ['websocket'],
    reconnection: true,
  });
  let retry: ReturnType<typeof setTimeout> | undefined;

  socket.on('operations.connected', () => handlers.onConnected());
  socket.on('operations.updated', (event: OperationsEvent) => {
    if (!DISPLAY_EVENTS.has(event?.type) || !event.data || typeof event.data.version !== 'number') return;
    const { version, ...rest } = event.data;
    handlers.onUpdate({
      version,
      snapshot: {
        state: rest.state ?? 'CART',
        items: rest.items ?? [],
        totalAmount: rest.totalAmount ?? 0,
        orderCode: rest.orderCode,
        callNumber: rest.callNumber,
        paymentMethod: rest.paymentMethod,
        qrCode: rest.qrCode,
        qrExpiresAt: rest.qrExpiresAt,
      },
    });
  });
  socket.on('disconnect', (reason) => {
    const kicked = reason === 'io server disconnect';
    handlers.onDisconnected(kicked);
    if (kicked) retry = setTimeout(() => socket.connect(), SERVER_KICK_RETRY_MS);
  });
  socket.on('connect_error', () => handlers.onDisconnected(false));

  return () => {
    clearTimeout(retry);
    socket.removeAllListeners();
    socket.disconnect();
  };
}
