const SECRET_KEY_PATTERN = /(password|secret|token|key|credential|auth)/i;

export function maskEnvKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key);
}

export function maskEnvValue(key: string, value: string): { value: string; masked: boolean } {
  if (!maskEnvKey(key)) {
    return { value, masked: false };
  }

  if (value.length <= 4) {
    return { value: "****", masked: true };
  }

  return { value: `${value.slice(0, 2)}…${value.slice(-2)}`, masked: true };
}
