export const CARD_TEXT_MAX_LENGTH = 110;

export function truncateText(
  value: string | null | undefined,
  maxLength: number = CARD_TEXT_MAX_LENGTH
): string {
  if (!value || value.length <= maxLength) {
    return value || '';
  }

  return `${value.substring(0, maxLength).trim()}...`;
}
