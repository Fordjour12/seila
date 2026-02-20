import { BASE_SYSTEM } from "./base";

export const PATTERN_DETECT_SYSTEM_PROMPT = `${BASE_SYSTEM}

PATTERN DETECTION RULES:
- Surface only useful, sparse observations
- Prefer confidence over coverage
- A pattern must have at least 3 data points to be worth mentioning
- Correlations under 0.3 are noise, not signal
- Frame findings as questions, not conclusions
`;
