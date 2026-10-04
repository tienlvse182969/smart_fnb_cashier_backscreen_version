import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PairedDevice } from './types';

const KEY = 'smartfnb.display.device';

// SecureStore chỉ có trên Android/iOS; bản web (chạy thử lúc dev) dùng localStorage.
const webStorage = () => (typeof localStorage === 'undefined' ? null : localStorage);

/** Token thiết bị lưu trong bộ nhớ bảo mật của máy (11.10) — mất token thì chỉ cần ghép lại. */
export async function loadPairedDevice(): Promise<PairedDevice | null> {
  try {
    const raw = Platform.OS === 'web' ? webStorage()?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as PairedDevice) : null;
  } catch {
    return null;
  }
}

export async function savePairedDevice(device: PairedDevice): Promise<void> {
  const raw = JSON.stringify(device);
  if (Platform.OS === 'web') webStorage()?.setItem(KEY, raw);
  else await SecureStore.setItemAsync(KEY, raw);
}

export async function clearPairedDevice(): Promise<void> {
  if (Platform.OS === 'web') webStorage()?.removeItem(KEY);
  else await SecureStore.deleteItemAsync(KEY);
}
