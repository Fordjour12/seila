/**
 * tonePolicy — mandatory post-processing for every agent output.
 *
 * Runs on the raw text from generateText before anything is returned or stored.
 * If the text contains disallowed fragments, returns a safe fallback.
 * No agent bypasses this.
 */

const DISALLOWED_FRAGMENTS = [
    "you failed",
    "failure",
    "you should",
    "you need to",
    "you must",
    "must",
    "lazy",
    "guilt",
    "shame",
    "missed",
    "behind",
    "streak",
    "bad job",
    "wrong",
    "disappointed",
];

const SAFE_FALLBACK = "Signal acknowledged. Keeping things contained and intentional.";

export function tonePolicy(text: string, fallback?: string): string {
    const lower = text.toLowerCase();

    for (const fragment of DISALLOWED_FRAGMENTS) {
        if (lower.includes(fragment)) {
            return fallback ?? SAFE_FALLBACK;
        }
    }

    return text;
}
