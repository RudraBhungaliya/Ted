export function calculateExpiryDate(durationDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    return expiresAt;
}
