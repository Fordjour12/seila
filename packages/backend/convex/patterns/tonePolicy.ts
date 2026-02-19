const disallowedFragments = [
  "you failed",
  "failure",
  "bad",
  "you should",
  "must",
  "wrong",
  "lazy",
  "guilt",
  "shame",
];

export function passesPatternTonePolicy(input: {
  headline: string;
  subtext: string;
}) {
  const combined = `${input.headline} ${input.subtext}`.toLowerCase();

  for (const fragment of disallowedFragments) {
    if (combined.includes(fragment)) {
      return false;
    }
  }

  return true;
}
