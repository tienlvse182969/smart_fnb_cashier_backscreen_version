import { create, type AxiosError } from 'axios';

/** Cùng backend với app thu ngân — cấu hình trong `.env` (xem `.env.example`). */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3100/api/v1';

/** Gốc server (bỏ `/api/v1`) — Socket.IO không nằm dưới tiền tố API. */
export const apiOrigin = () => API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export class ApiError extends Error {
  /** `status === 0` = không tới được máy chủ (mất mạng, server tắt). */
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = create({ baseURL: API_BASE_URL, timeout: 15_000 });

apiClient.interceptors.response.use(
  (response) => response,
  (reason: AxiosError<{ message?: string | string[] }>) => {
    const raw = reason.response?.data?.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw ?? reason.message ?? 'Không thể kết nối máy chủ';
    throw new ApiError(reason.response?.status ?? 0, message);
  },
);
