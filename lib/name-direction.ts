export type NameDirection = 'any' | 'familiar' | 'timeless' | 'contemporary';
export const nameDirections: NameDirection[] = ['any', 'familiar', 'timeless', 'contemporary'];
export const directionLabels: Record<NameDirection, string> = {
  any: 'Keep it open', familiar: 'Familiar', timeless: 'Timeless', contemporary: 'Contemporary',
};
export const directionHelp = 'A preference based on editorial tags and limited source signals, not a match to your age or a nationwide popularity ranking.';
