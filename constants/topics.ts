import type { AgeBand } from './theme';

/** A school subject the learner can teach Mentio. */
export type Topic = {
    id: string;
    title: string;
    blurb: string;
};

/**
 * Subjects offered at onboarding, scoped to common school levels.
 * They get more advanced as the age band rises.
 */
export const TOPICS_BY_AGE: Record<AgeBand, Topic[]> = {
    // Ages 5–9 — early primary
    kid: [
        {
            id: 'counting',
            title: 'Counting & Numbers',
            blurb: 'How numbers work and counting up.',
        },
        {
            id: 'reading',
            title: 'Reading & Letters',
            blurb: 'How letters make words.',
        },
        {
            id: 'shapes',
            title: 'Shapes',
            blurb: 'Circles, squares and more.',
        },
        {
            id: 'nature',
            title: 'Animals & Nature',
            blurb: 'Living things around us.',
        },
        {
            id: 'colors',
            title: 'Colors & Art',
            blurb: 'Mixing and making colors.',
        },
        {
            id: 'time',
            title: 'Telling Time',
            blurb: 'Clocks, hours and minutes.',
        },
    ],

    // Ages 10–15 — middle school
    teen: [
        {
            id: 'math',
            title: 'Mathematics',
            blurb: 'Fractions, ratios and equations.',
        },
        {
            id: 'science',
            title: 'Science',
            blurb: 'How the physical world works.',
        },
        {
            id: 'history',
            title: 'History',
            blurb: 'People and events of the past.',
        },
        {
            id: 'geography',
            title: 'Geography',
            blurb: 'Maps, places and the planet.',
        },
        {
            id: 'english',
            title: 'English & Language',
            blurb: 'Grammar, writing and meaning.',
        },
        {
            id: 'coding',
            title: 'Computers & Coding',
            blurb: 'How programs follow instructions.',
        },
    ],

    // Ages 15–20 — high school / early college
    mature: [
        {
            id: 'algebra',
            title: 'Algebra',
            blurb: 'Variables, functions and proofs.',
        },
        {
            id: 'physics',
            title: 'Physics',
            blurb: 'Motion, forces and energy.',
        },
        {
            id: 'chemistry',
            title: 'Chemistry',
            blurb: 'Atoms, bonds and reactions.',
        },
        {
            id: 'biology',
            title: 'Biology',
            blurb: 'Cells, genetics and evolution.',
        },
        {
            id: 'economics',
            title: 'Economics',
            blurb: 'Markets, value and incentives.',
        },
        {
            id: 'cs',
            title: 'Computer Science',
            blurb: 'Algorithms and complexity.',
        },
    ],
};

/** Flat list of every subject across ages. */
export const ALL_TOPICS: Topic[] = Object.values(TOPICS_BY_AGE).flat();

export function topicsForAge(age: AgeBand): Topic[] {
    return TOPICS_BY_AGE[age];
}

export function getTopic(id: string | undefined): Topic {
    return ALL_TOPICS.find((t) => t.id === id) ?? TOPICS_BY_AGE.kid[0];
}
