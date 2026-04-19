import type { AuthContent } from "@/lib/slices/authSlice";

const AUTH_STORAGE_KEY = "auth";

type StoredAuthPayload = {
  content: AuthContent;
  expiresAt: number;
};
function isAuthContent(value: unknown): value is AuthContent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as {
    token?: unknown;
    expiresIn?: unknown;
    user?: unknown;
  };

  if (typeof candidate.token !== "string" || typeof candidate.expiresIn !== "number") {
    return false;
  }

  if (!candidate.user || typeof candidate.user !== "object") {
    return false;
  }

  const user = candidate.user as {
    id?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    phoneNumber?: unknown;
  };

  return (
    typeof user.id === "number" &&
    typeof user.firstName === "string" &&
    typeof user.lastName === "string" &&
    typeof user.email === "string" &&
    typeof user.phoneNumber === "string"
  );
}

function normalizeExpiresAt(expiresIn: number, now: number): number | null {
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    return null;
  }

  if (expiresIn < 157_680_000) {
    return now + Math.floor(expiresIn * 1000);
  }

  if (expiresIn < 157_680_000_000) {
    return now + Math.floor(expiresIn);
  }

  if (expiresIn < 1_000_000_000_000) {
    return Math.floor(expiresIn * 1000);
  }

  return Math.floor(expiresIn);
}

function parseStoredAuth(raw: string, now = Date.now()): AuthContent | null {
  const parsed: unknown = JSON.parse(raw);

  if (parsed && typeof parsed === "object" && "content" in parsed && "expiresAt" in parsed) {
    const envelope = parsed as Partial<StoredAuthPayload>;
    if (!isAuthContent(envelope.content) || typeof envelope.expiresAt !== "number") {
      return null;
    }
    return envelope.expiresAt > now ? envelope.content : null;
  }

  if (!isAuthContent(parsed)) {
    return null;
  }

  const expiresAt = normalizeExpiresAt(parsed.expiresIn, now);
  if (!expiresAt || expiresAt <= now) {
    return null;
  }

  return parsed;
}

export function restoreAuthFromStorage(now = Date.now()): AuthContent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return parseStoredAuth(raw, now);
  } catch {
    return null;
  }
}
export function clearPersistedAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
