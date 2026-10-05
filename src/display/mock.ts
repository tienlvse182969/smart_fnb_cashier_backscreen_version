export type Poster = {
  id: string;
  source: number;
};

/** Áp phích hiển thị lúc không có khách — thêm ảnh vào mảng này, màn hình chờ tự xoay vòng. */
export const posters: Poster[] = [
  { id: 'matcha', source: require('../../assets/images/apphichmau.jpg') },
];
