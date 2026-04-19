import type { AuthContent } from "@/lib/slices/authSlice";

const AUTH_STORAGE_KEY = "auth";

type StoredAuthPayload = {
  content: AuthContent;
  expiresAt: number;
};

function isAuthContent(value: unknown): value is AuthContent {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<AuthContent> & {
    user?: Partial<AuthContent["user"]>;
  };

  return (
    typeof candidate.token === "string" &&
    typeof candidate.expiresIn === "number" &&
    !!candidate.user &&
    typeof candidate.user.id === "number" &&
    typeof candidate.user.firstName === "string" &&
    typeof candidate.user.lastName === "string" &&
    typeof candidate.user.email === "string" &&
    typeof candidate.user.phoneNumber === "string"
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

export function persistAuthSession(content: AuthContent, now = Date.now()): boolean {
  if (typeof window === "undefined" || !isAuthContent(content)) {
    return false;
  }

  const expiresAt = normalizeExpiresAt(content.expiresIn, now);
  if (!expiresAt || expiresAt <= now) {
    return false;
  }

  const payload: StoredAuthPayload = { content, expiresAt };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export function clearPersistedAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
