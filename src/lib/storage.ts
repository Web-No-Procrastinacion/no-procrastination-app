// Persistencia del prototipo en localStorage (solo navegador).
import type { UserData } from "./types";

const USER_PREFIX = "constancia:user:";
const SESSION_KEY = "constancia:session";
const CLOCK_KEY = "constancia:clock";

export class SaveError extends Error {}

let failNextSave = false;

export function simulateNextSaveFailure() {
  failNextSave = true;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function userExists(email: string): boolean {
  return localStorage.getItem(USER_PREFIX + normalizeEmail(email)) !== null;
}

export function loadUser(email: string): UserData | null {
  const raw = localStorage.getItem(USER_PREFIX + normalizeEmail(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
}

/** Guarda los datos del usuario. Lanza SaveError si se simuló un fallo. */
export function saveUser(data: UserData, opts: { ignoreSimulatedFailure?: boolean } = {}) {
  if (failNextSave && !opts.ignoreSimulatedFailure) {
    failNextSave = false;
    throw new SaveError("Fallo de guardado simulado");
  }
  try {
    localStorage.setItem(USER_PREFIX + normalizeEmail(data.email), JSON.stringify(data));
  } catch {
    throw new SaveError("No se pudo escribir en el almacenamiento");
  }
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(email: string | null) {
  if (email) localStorage.setItem(SESSION_KEY, normalizeEmail(email));
  else localStorage.removeItem(SESSION_KEY);
}

export function getClockOffset(): number {
  const n = Number(localStorage.getItem(CLOCK_KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}

export function setClockOffset(days: number) {
  if (days === 0) localStorage.removeItem(CLOCK_KEY);
  else localStorage.setItem(CLOCK_KEY, String(days));
}
