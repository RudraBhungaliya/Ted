export function calculateExpiryDate(durationDays: number) {
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + durationDays);

  return expiresAt;
}
