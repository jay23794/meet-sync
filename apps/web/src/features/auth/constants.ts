/** Seeds fed into https://api.dicebear.com/7.x/pixel-art/svg?seed=<seed> */
export const AVATAR_SEEDS = [
  'shadow', 'pixel', 'nova',   'blaze',
  'echo',   'spark', 'cipher', 'vapor',
  'frost',  'drift', 'glitch', 'byte',
] as const;

export type AvatarSeed = (typeof AVATAR_SEEDS)[number];

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=b5e18b,eae6bc`;
}
