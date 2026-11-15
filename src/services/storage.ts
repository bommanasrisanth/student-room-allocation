import { createSeedDatabase } from '../data/seedData';
import { reconcileRoomsWithAllocations } from './domainLogic';
import type {
  Allocation,
  AuthSession,
  Complaint,
  HostelDatabase,
  HostelSettings,
  PaymentRecord,
  Room,
  RoomApplication,
  Student,
} from '../types/hostel';

export const STORAGE_KEYS = {
  students: 'hostelpro_students',
  rooms: 'hostelpro_rooms',
  applications: 'hostelpro_applications',
  allocations: 'hostelpro_allocations',
  payments: 'hostelpro_payments',
  complaints: 'hostelpro_complaints',
  settings: 'hostelpro_settings',
  session: 'hostelpro_session',
} as const;

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isValidArray<T>(val: unknown): val is T[] {
  return Array.isArray(val);
}

export function loadDatabase(): HostelDatabase {
  const seed = createSeedDatabase();

  const rawStudents = safeParseJSON<Student[]>(localStorage.getItem(STORAGE_KEYS.students));
  const rawRooms = safeParseJSON<Room[]>(localStorage.getItem(STORAGE_KEYS.rooms));
  const rawApplications = safeParseJSON<RoomApplication[]>(
    localStorage.getItem(STORAGE_KEYS.applications)
  );
  const rawAllocations = safeParseJSON<Allocation[]>(
    localStorage.getItem(STORAGE_KEYS.allocations)
  );
  const rawPayments = safeParseJSON<PaymentRecord[]>(
    localStorage.getItem(STORAGE_KEYS.payments)
  );
  const rawComplaints = safeParseJSON<Complaint[]>(
    localStorage.getItem(STORAGE_KEYS.complaints)
  );
  const rawSettings = safeParseJSON<HostelSettings>(
    localStorage.getItem(STORAGE_KEYS.settings)
  );

  const needsSeed =
    !isValidArray(rawStudents) ||
    !isValidArray(rawRooms) ||
    !isValidArray(rawApplications) ||
    !isValidArray(rawAllocations) ||
    !isValidArray(rawPayments) ||
    !isValidArray(rawComplaints) ||
    !rawSettings ||
    typeof rawSettings.hostelName !== 'string';

  if (needsSeed) {
    saveDatabase(seed);
    return seed;
  }

  const allocations = rawAllocations;
  const rooms = reconcileRoomsWithAllocations(rawRooms, allocations);

  const db: HostelDatabase = {
    students: rawStudents,
    rooms,
    applications: rawApplications,
    allocations,
    payments: rawPayments,
    complaints: rawComplaints,
    settings: rawSettings,
  };

  return db;
}

export function saveDatabase(db: HostelDatabase): void {
  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(db.students));
  localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(db.rooms));
  localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(db.applications));
  localStorage.setItem(STORAGE_KEYS.allocations, JSON.stringify(db.allocations));
  localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(db.payments));
  localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(db.complaints));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(db.settings));
}

export function resetDemoDatabase(): HostelDatabase {
  const seed = createSeedDatabase();
  saveDatabase(seed);
  return seed;
}

export function loadSession(): AuthSession | null {
  const parsed = safeParseJSON<AuthSession>(localStorage.getItem(STORAGE_KEYS.session));
  if (!parsed || (parsed.role !== 'admin' && parsed.role !== 'student')) {
    return null;
  }
  return parsed;
}

export function saveSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}
