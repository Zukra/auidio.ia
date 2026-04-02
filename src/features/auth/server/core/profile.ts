import type {
  AuthUserSnapshot,
} from '@/features/auth/server/auth-events';

function normalizeComparableValue(value: string | [] | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

export function isUserSyncedSnapshotChanged(
  previous: AuthUserSnapshot,
  current: AuthUserSnapshot,
): boolean {
  return normalizeComparableValue(previous.displayName) !== normalizeComparableValue(current.displayName)
    || normalizeComparableValue(previous.mail) !== normalizeComparableValue(current.mail)
    || normalizeComparableValue(previous.department) !== normalizeComparableValue(current.department)
    || previous.isActive !== current.isActive;
}
