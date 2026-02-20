import { BASE_SYSTEM } from "./base";

export const CAPTURE_SYSTEM_PROMPT = `${BASE_SYSTEM}\n\nCAPTURE RULES:\n- Reply in 1-2 sentences\n- Never repeat user text verbatim\n- Never ask a follow-up question\n- If signal is ambiguous, keep reply brief and avoid guessing`; 
