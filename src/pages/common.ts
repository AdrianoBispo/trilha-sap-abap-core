export type AvatarColorScheme =
  | 'Accent1' | 'Accent2' | 'Accent3' | 'Accent4' | 'Accent5'
  | 'Accent6' | 'Accent7' | 'Accent8' | 'Accent9' | 'Accent10';

export const accent = (n?: number): AvatarColorScheme => `Accent${Math.min(10, Math.max(1, n || 6))}` as AvatarColorScheme;
