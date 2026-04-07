/**
 * Returns a trimmed lowercase email for storage, or undefined if missing/empty.
 * Storing "" would violate MongoDB unique sparse indexes (many documents with "").
 */
function normalizeEmail(email) {
  if (email == null) return undefined;
  const t = String(email).trim();
  return t === '' ? undefined : t.toLowerCase();
}

module.exports = { normalizeEmail };
