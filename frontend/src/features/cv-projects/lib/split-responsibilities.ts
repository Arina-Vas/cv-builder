const SEPARATOR = /[,\n]/;

export const splitResponsibilities = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split(SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);
