// Обрезает длинную строку до max символов и добавляет «…». Короткие строки не трогает.
export const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
