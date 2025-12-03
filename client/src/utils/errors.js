export function formatError(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  const candidates = [
    err.reason,
    err.shortMessage,
    err.data?.message,
    err.error?.message,
    err.message,
  ].filter(Boolean);
  if (candidates.length > 0) return String(candidates[0]);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
