/**
 * Mentio palette — soft, friendly learning-app look.
 *
 * Light blue-grey surfaces, deep navy ink, a coral signature accent, and a
 * fresh green for primary actions. Rounded, approachable, and printed-feeling
 * rather than the violet/neon gradients common to AI-generated apps.
 */
export const Mentio = {
  // Surfaces
  paper: '#EEF2F8', // app background (cool off-white)
  sand: '#E2E9F4', // raised cards / panels
  chalk: '#FBFCFE', // bright card white

  // Ink
  ink: '#2E2D5B', // primary text (deep navy)
  inkSoft: '#6E7191', // secondary text
  stone: '#C7CEDB', // muted / borders

  // Signature accent (coral)
  clay: '#F25C5C',
  clayDeep: '#D94A4A',

  // Soft highlight accent (muted violet — refined, ties to the navy ink)
  lilac: '#6C5E9C',
  lilacDeep: '#564A80',

  // Primary action (green)
  pine: '#7BD957',
  pineDeep: '#5FBE3E',

  // Friendly highlight (sky blue) — robot eyes, badges
  ochre: '#5B8DEF',
  ochreDeep: '#3F6FD0',
} as const;

export const Colors = {
  light: {
    text: Mentio.ink,
    background: Mentio.paper,
    tint: Mentio.clay,
    icon: Mentio.inkSoft,
  },
  dark: {
    text: Mentio.chalk,
    background: '#1E1F3A',
    tint: Mentio.clay,
    icon: Mentio.stone,
  },
} as const;

/**
 * Mentio adapts his look to the learner's age. As age rises he becomes more
 * grown-up: calmer form, sleeker proportions, less "toy", more "tool".
 * The surrounding UI stays consistent (warm paper + terracotta) across ages.
 */
export type AgeBand = 'kid' | 'teen' | 'mature';

export const AGE_BANDS: Record<
  AgeBand,
  { label: string; range: string; tagline: string; accent: string; bg: string }
> = {
  kid: {
    label: 'Mentio',
    range: 'Ages 5–9',
    tagline: 'the robot you get to teach',
    accent: Mentio.lilac,
    bg: Mentio.paper,
  },
  teen: {
    label: 'Mentio',
    range: 'Ages 10–15',
    tagline: 'still learning — explain it to me',
    accent: Mentio.lilac,
    bg: Mentio.paper,
  },
  mature: {
    label: 'MENTIO',
    range: 'Ages 15–20',
    tagline: 'teach the concept. I will probe it.',
    accent: Mentio.lilac,
    bg: Mentio.paper,
  },
} as const;
