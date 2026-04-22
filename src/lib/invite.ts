const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createInviteCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase().replaceAll("O", "0").replaceAll("I", "1");
}
