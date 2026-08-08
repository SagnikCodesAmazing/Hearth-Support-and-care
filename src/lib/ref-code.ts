const ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3479";

export function makeRefCode(prefix: "HT" | "HR" | "FN") {
  let body = "";
  for (let i = 0; i < 6; i += 1) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${body}`;
}

export const REF_CODE_PATTERN = /^(HT|HR|FN)-[A-Z0-9]{6}$/;
