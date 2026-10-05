import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError } from '@/src/lib/api-client';
import { usePairedDevice, usePairing } from '@/src/pairing/pairing-store';
import { fetchDisplayContext } from '@/src/services/display-api';
import { connectStation } from '@/src/services/display-realtime';
import { useDisplay } from './display-store';

/** Backend không báo khi Manager thu hồi màn hình → định kỳ hỏi lại để tự gỡ khỏi quầy. */
const VERIFY_MS = 60_000;
/** Mất kết nối quá ngần này mới hiện nhãn, tránh nháy khi socket nối lại nhanh. */
const OFFLINE_NOTICE_MS = 5_000;

/**
 * Server không nhận màn hình này nữa: 403 = token bị thu hồi; 404 kèm thông báo của backend = quầy
 * ngừng dùng. 404 không có thông báo (backend cũ chưa có API) thì không gỡ ghép.
 */
const isRejected = (reason: unknown) =>
  reason instanceof ApiError &&
  (reason.status === 403 || (reason.status === 404 && /station/i.test(reason.message)));

const StationSyncContext =createContext<{ offline: boolean }>({ offline: false });

/**
 * Đồng bộ màn hình khách với quầy đã ghép (11.11): tải trạng thái hiện tại từ server, nghe
 * Socket.IO để cập nhật tức thì, tải lại mỗi lần nối lại (thay cho `station:sync`).
 * Token bị từ chối (403/404) → gỡ ghép, quay về màn hình xin mã.
 */
export function StationSyncProvider({ children }: { children: ReactNode }) {
  const device = usePairedDevice();
  const { revoke } = usePairing();
  const { dispatch } = useDisplay();
  const [offline, setOffline] = useState(false);
  const token = device?.token;

  useEffect(() => {
    if (!token) return;
    let active = true;
    let offlineTimer: ReturnType<typeof setTimeout> | undefined;
    const markOnline = () => {
      clearTimeout(offlineTimer);
      offlineTimer = undefined;
      setOffline(false);
    };
    const markOffline = () => {
      offlineTimer ??= setTimeout(() => setOffline(true), OFFLINE_NOTICE_MS);
    };

    const load = async () => {
      try {
        const context = await fetchDisplayContext(token);
        if (active) dispatch({ type: 'display:snapshot', version: context.version, snapshot: context.snapshot });
      } catch (reason) {
        if (!active) return;
        if (isRejected(reason)) void revoke();
        // lỗi mạng: giữ nguyên màn hình, socket tự nối lại
      }
    };

    dispatch({ type: 'display:reset' });
    setOffline(false);
    markOffline();
    void load();
    const disconnect = connectStation(token, {
      onUpdate: (update) => dispatch({ type: 'display:snapshot', ...update }),
      onConnected: () => {
        markOnline();
        void load();
      },
      onDisconnected: (kicked) => {
        markOffline();
        // server chủ động ngắt → có thể token đã bị thu hồi
        if (kicked) void load();
      },
    });
    const verify = setInterval(() => void load(), VERIFY_MS);

    return () => {
      active = false;
      clearTimeout(offlineTimer);
      clearInterval(verify);
      disconnect();
    };
  }, [token, dispatch, revoke]);

  const value = useMemo(() => ({ offline: !!token && offline }), [token, offline]);
  return <StationSyncContext.Provider value={value}>{children}</StationSyncContext.Provider>;
}

export function useStationSync() {
  return useContext(StationSyncContext);
}
