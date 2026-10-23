import type { ImageSource } from 'expo-image';

import { apiOrigin } from '@/src/lib/api-client';
import type { DisplayPosterDto } from '@/src/services/display-api';

export type DisplayPoster = {
  id: string;
  source: ImageSource | number;
  /** thời gian hiện trước khi chuyển ảnh kế */
  durationMs: number;
  /** `contain` (mặc định): hiện nguyên khổ, không cắt chữ trên áp phích. `cover`: phủ kín khung, dùng cho ảnh nền không có chữ. */
  fit?: 'contain' | 'cover';
};

const DEFAULT_SECONDS = 8;
const MIN_SECONDS = 3;
const MAX_SECONDS = 60;

/** Áp phích có sẵn trong app — hiện khi Owner chưa bật áp phích nào (hoặc backend chưa trả). */
export const fallbackPosters: DisplayPoster[] = [
  {
    id: 'default',
    source: require('../../assets/images/apphichmau.jpg'),
    durationMs: DEFAULT_SECONDS * 1000,
    // ảnh tỉ lệ 3:2, không khớp khung màn hình quầy → phủ kín thay vì để viền mờ hai bên
    fit: 'cover',
  },
];

/** `/uploads/...` của backend → URL đầy đủ (ảnh nằm ngoài `/api/v1`); URL tuyệt đối giữ nguyên. Dùng cho áp phích và logo chuỗi. */
export const absoluteUrl =(url: string) =>
  /^(https?:|data:)/i.test(url) ? url : `${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`;

/** Backend → danh sách hiển thị. Giữ nguyên thứ tự backend đã xếp; bỏ mục thiếu ảnh; ép thời lượng vào 3–60 giây. */
export function toDisplayPosters(dtos: DisplayPosterDto[]): DisplayPoster[] {
  return dtos
    .filter((dto) => !!dto.imageUrl)
    .map((dto) => {
      const seconds = Number.isFinite(dto.durationSeconds) ? dto.durationSeconds : DEFAULT_SECONDS;
      return {
        id: dto.id,
        source: { uri: absoluteUrl(dto.imageUrl) },
        durationMs: Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, seconds)) * 1000,
      };
    });
}

const sourceKey = (source: DisplayPoster['source']) => (typeof source === 'number' ? source : source.uri);

/** Cùng ảnh, cùng thứ tự, cùng thời lượng → không đổi state, để vòng xoay không bị giật về đầu mỗi lần hỏi lại. */
export function samePosters(a: DisplayPoster[], b: DisplayPoster[]) {
  return (
    a.length === b.length &&
    a.every((poster, i) => poster.id === b[i].id && poster.durationMs === b[i].durationMs && sourceKey(poster.source) === sourceKey(b[i].source))
  );
}
