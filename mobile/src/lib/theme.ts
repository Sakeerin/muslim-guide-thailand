/** Minimal shared design tokens (brand teal). Pure constants. */
export const colors = {
  brand: '#0f766e',
  brandDark: '#115e59',
  bg: '#ffffff',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  // halal trust tones
  certified: '#15803d',
  owned: '#0d9488',
  friendly: '#b45309',
  unverified: '#64748b',
  sponsored: '#7c3aed',
  danger: '#b91c1c',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
