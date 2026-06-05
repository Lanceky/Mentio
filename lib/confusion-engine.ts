import type { MentioMood } from '@/components/mentio/MentioRobot';
import type { AgeBand } from '@/constants/theme';
import { getTopic } from '@/constants/topics';

export type MentioReply = {
    text: string;
    mood: MentioMood;
    /** True when Mentio is satisfied the explanation holds — a celebration moment. */
    gotIt: boolean;
};

/**
 * Mentio's "confusion engine".
 *
 * Core rule of the protégé effect: Mentio NEVER corrects the child. He only gets
 * confused in ways that surface the gap, asking naive follow-ups. When the
 * explanation is solid he "gets it" and celebrates. There is no failure state.
 *
 * This is a deliberately simple local engine (no network, no scoring) so the loop
 * works offline. It can later be swapped for an LLM behind the same signature.
 */

/** Keyword-triggered naive follow-ups per subject. Subjects without an entry use the generic engine. */
const TOPIC_PROBES: Record<string, { match: RegExp; ask: Record<AgeBand, string> }[]> = {
    cs: [
        {
            match: /big|large|greater|more|high/,
            ask: {
                kid: 'But how do you KNOW which one is bigger? What if they look the same? \u{1F914}',
                teen: 'How do you actually compare two numbers to see which is bigger?',
                mature: 'Define the comparison. What does "greater than" mean precisely?',
            },
        },
        {
            match: /order|arrange|line up|sequence/,
            ask: {
                kid: 'What does \u201Corder\u201D mean though? Why this order and not backwards?',
                teen: 'Why that order specifically? What rule are you following each step?',
                mature: 'State the ordering relation. Is it total? What guarantees termination?',
            },
        },
        {
            match: /swap|switch|move|put|place/,
            ask: {
                kid: 'Wait, you moved them! When are you allowed to move one? \u{1F440}',
                teen: 'When exactly do you swap two of them, and when do you leave them?',
                mature: 'What condition triggers a swap, and why does repeating it converge?',
            },
        },
    ],
    science: [
        {
            match: /repeat|again|same|cycle|loop/,
            ask: {
                kid: 'Repeats how? How do you know what comes next? \u{1F633}',
                teen: 'If it repeats, what tells you the NEXT thing without seeing it?',
                mature: 'What is the period, and what rule generates term n+1 from term n?',
            },
        },
        {
            match: /next|predict|follow|comes after/,
            ask: {
                kid: 'But how can you know the next one if it didn\u2019t happen yet??',
                teen: 'How do you predict the next one? What are you actually using?',
                mature: 'Formalize the prediction rule. Where could it break?',
            },
        },
    ],
    counting: [
        {
            match: /count|counting|one more|plus|add|together/,
            ask: {
                kid: 'Counting? But where do the new numbers COME from? \u{1F914}',
                teen: 'When you count on, why does counting give the right answer?',
                mature: 'Why does repeated succession (counting) equal addition?',
            },
        },
        {
            match: /group|combine|join|put together/,
            ask: {
                kid: 'If I put them together, why don\u2019t I get MORE than four?',
                teen: 'Combining two groups — why is the total fixed and not changing?',
                mature: 'Why is the cardinality of the union independent of how you combine?',
            },
        },
    ],
    math: [
        {
            match: /half|part|piece|slice|cut|divide|split/,
            ask: {
                kid: 'But it\u2019s still ONE cookie if I cut it! How is it half? \u{1F36A}',
                teen: 'If you cut it, the cookie didn\u2019t shrink — so what does 1/2 measure?',
                mature: 'What exactly is being halved — the object, or a quantity of it?',
            },
        },
        {
            match: /bottom|denominator|number below|more pieces/,
            ask: {
                kid: 'The bottom number is BIGGER but the piece is smaller?! Why?? \u{1F635}',
                teen: 'Why does a bigger bottom number make each piece smaller?',
                mature: 'Explain the inverse relationship between denominator and magnitude.',
            },
        },
    ],
};

/** Generic naive nudges when nothing specific is detected. */
const GENERIC: Record<AgeBand, string[]> = {
    kid: [
        'But... why? \u{1F914}',
        'What if I didn\u2019t want to do that?',
        'Can you say it like I\u2019m a baby robot?',
        'Wait, what does that word mean?',
        'Show me with toys! How would that look?',
    ],
    teen: [
        'Okay, but why does that actually work?',
        'What happens if you do the opposite?',
        'How would you know if you were wrong?',
        'Can you give me a tiny example?',
        'What\u2019s the one rule behind all of that?',
    ],
    mature: [
        'State the underlying invariant.',
        'What about the edge case where it\u2019s empty?',
        'Why is that always true, not just usually?',
        'Give a counterexample that should fail \u2014 why doesn\u2019t it?',
        'Reduce that to its simplest principle.',
    ],
};

const ENCOURAGE: Record<AgeBand, string[]> = {
    kid: ['Ohh, keep going!', 'Hmm, almost! Tell me more!', 'I think I\u2019m getting it...'],
    teen: ['Okay, I\u2019m following...', 'Right, and then?', 'Getting clearer \u2014 keep going.'],
    mature: ['Continue.', 'Go on.', 'Noted. And?'],
};

const CELEBRATE: Record<AgeBand, string[]> = {
    kid: [
        'OHHHH NOW I GET IT!! You\u2019re the best teacher! \u{1F389}',
        'Wait that makes SO much sense now! Thank you!! \u2728',
    ],
    teen: [
        'Oh — that actually clicks now. Nice explanation.',
        'Yeah, I get it. You explained that really well.',
    ],
    mature: [
        'Consistent. Your model holds. Well argued.',
        'That\u2019s a complete explanation. I\u2019m convinced.',
    ],
};

function pick<T>(arr: T[], seed: number): T {
    return arr[seed % arr.length];
}

/** Mentio's opening line for a fresh session. */
export function opener(topicId: string, _age: AgeBand): MentioReply {
    return { text: getTopic(topicId).opener, mood: 'curious', gotIt: false };
}

/**
 * Heuristic for whether the explanation feels solid enough for Mentio to "get it".
 * Rewards substance and concrete reasoning words — never punishes anything.
 */
function looksSolid(text: string, turn: number): boolean {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const hasReasoning = /because|so that|means|if|then|when|every|always|first|each/i.test(text);
    const hasExample = /example|like|for instance|such as|\d/.test(text);
    const substantial = words.length >= 12;
    // Needs at least a couple of exchanges plus a substantive, reasoned answer.
    return turn >= 2 && substantial && (hasReasoning || hasExample);
}

/**
 * Generate Mentio's next reply to the child's explanation.
 * @param turn number of explanations the child has given so far (0-based before this one)
 */
export function generateReply(params: {
    topicId: string;
    age: AgeBand;
    userText: string;
    turn: number;
}): MentioReply {
    const { topicId, age, userText, turn } = params;
    const text = userText.toLowerCase();
    const seed = userText.length + turn;

    if (looksSolid(userText, turn)) {
        return { text: pick(CELEBRATE[age], seed), mood: 'celebrate', gotIt: true };
    }

    // Try a topic-specific probe triggered by what the child actually said.
    const probes = TOPIC_PROBES[topicId] ?? [];
    const hit = probes.find((p) => p.match.test(text));
    if (hit) {
        return { text: hit.ask[age], mood: 'curious', gotIt: false };
    }

    // Otherwise alternate between a gentle encouragement and a generic naive nudge.
    if (turn > 0 && seed % 2 === 0) {
        return { text: pick(ENCOURAGE[age], seed), mood: 'nod', gotIt: false };
    }
    return { text: pick(GENERIC[age], seed), mood: 'curious', gotIt: false };
}

/** When the child uploads study material, Mentio reacts naively to it. */
export function reactToMaterial(fileName: string, topicId: string, age: AgeBand): MentioReply {
    const topic = getTopic(topicId).title.toLowerCase();
    const lines: Record<AgeBand, string> = {
        kid: `I looked at \u201C${fileName}\u201D but it has SO many words! Can you just tell me about ${topic}? \u{1F979}`,
        teen: `Okay, I skimmed \u201C${fileName}\u201D. I still don\u2019t really get ${topic} though \u2014 explain it your way?`,
        mature: `I parsed \u201C${fileName}\u201D. Summarize the core idea of ${topic} in your own words and I\u2019ll probe it.`,
    };
    return { text: lines[age], mood: 'curious', gotIt: false };
}
