import type { AgeBand } from './theme';

/** A school subject the learner can teach Mentio. */
export type Topic = {
    id: string;
    title: string;
    blurb: string;
    /** Mentio's first confused question (already age-specific, since subjects vary by age). */
    opener: string;
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
            opener: "You said put them in order... but what does \u201Corder\u201D even mean? \u{1F914}",
        },
        {
            id: 'reading',
            title: 'Reading & Letters',
            blurb: 'How letters make words.',
            opener: 'How do squiggly letters turn into words I can say out loud?? \u{1F633}',
        },
        {
            id: 'shapes',
            title: 'Shapes',
            blurb: 'Circles, squares and more.',
            opener: 'Why is a square a square and not a circle? They\u2019re both shapes! \u{1F440}',
        },
        {
            id: 'nature',
            title: 'Animals & Nature',
            blurb: 'Living things around us.',
            opener: 'How do you know if something is alive or not alive? \u{1F43E}',
        },
        {
            id: 'colors',
            title: 'Colors & Art',
            blurb: 'Mixing and making colors.',
            opener: 'If I mix blue and yellow... why does GREEN show up?? \u{1F3A8}',
        },
        {
            id: 'time',
            title: 'Telling Time',
            blurb: 'Clocks, hours and minutes.',
            opener: 'The little hand and big hand confuse me. What do they mean? \u{1F551}',
        },
    ],

    // Ages 10–15 — middle school
    teen: [
        {
            id: 'math',
            title: 'Mathematics',
            blurb: 'Fractions, ratios and equations.',
            opener: 'If 1/2 is smaller than 1, why does the 2 on the bottom make it smaller?',
        },
        {
            id: 'science',
            title: 'Science',
            blurb: 'How the physical world works.',
            opener: 'So why does ice float on water if it\u2019s the same stuff?',
        },
        {
            id: 'history',
            title: 'History',
            blurb: 'People and events of the past.',
            opener: 'How do we even KNOW what happened before anyone was filming it?',
        },
        {
            id: 'geography',
            title: 'Geography',
            blurb: 'Maps, places and the planet.',
            opener: 'If the Earth is round, why doesn\u2019t the map look round?',
        },
        {
            id: 'english',
            title: 'English & Language',
            blurb: 'Grammar, writing and meaning.',
            opener: 'Why does word order change the meaning so much? Who decided that?',
        },
        {
            id: 'coding',
            title: 'Computers & Coding',
            blurb: 'How programs follow instructions.',
            opener: 'How does a computer “know” what to do? It\u2019s just metal, right?',
        },
    ],

    // Ages 15–20 — high school / early college
    mature: [
        {
            id: 'algebra',
            title: 'Algebra',
            blurb: 'Variables, functions and proofs.',
            opener: 'Define what a variable actually represents. Why is x allowed to be anything?',
        },
        {
            id: 'physics',
            title: 'Physics',
            blurb: 'Motion, forces and energy.',
            opener: 'State precisely what "force" is. Not what it does \u2014 what it is.',
        },
        {
            id: 'chemistry',
            title: 'Chemistry',
            blurb: 'Atoms, bonds and reactions.',
            opener: 'Why do two atoms bond at all? What does the system actually minimize?',
        },
        {
            id: 'biology',
            title: 'Biology',
            blurb: 'Cells, genetics and evolution.',
            opener: 'Define "alive" rigorously. Where exactly is the boundary?',
        },
        {
            id: 'economics',
            title: 'Economics',
            blurb: 'Markets, value and incentives.',
            opener: 'What determines price? And why should supply and demand meet at all?',
        },
        {
            id: 'cs',
            title: 'Computer Science',
            blurb: 'Algorithms and complexity.',
            opener: 'Define "sorted" formally. What property must hold between adjacent elements?',
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
