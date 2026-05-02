/**
 * Mock data layer for Admin Job Seekers management.
 * In-memory store only. Replace with API calls when backend is ready.
 */

export type JobSeekerStatus = 'active' | 'suspended' | 'banned';

export type JobSeeker = {
  id: string;
  name: string;
  email: string;
  status: JobSeekerStatus;
  createdAt: string; // ISO
  lastLogin: string | null; // ISO or null
  banReason?: string; // set when status is 'banned'
};

// In-memory store (re-initialized on module load / refresh)
let store: JobSeeker[] = [
  { id: '1', name: 'Sarah Keller', email: 'sarah.k@example.com', status: 'active', createdAt: '2025-01-15T10:00:00Z', lastLogin: '2025-02-01T09:15:00Z' },
  { id: '2', name: 'Marc Berner', email: 'marc.berner@example.com', status: 'active', createdAt: '2025-01-14T14:30:00Z', lastLogin: '2025-01-31T16:22:00Z' },
  { id: '3', name: 'Lisa Müller', email: 'lisa.mueller@example.com', status: 'suspended', createdAt: '2025-01-10T08:00:00Z', lastLogin: '2025-01-28T11:00:00Z' },
  { id: '4', name: 'Pierre Dubois', email: 'pierre.dubois@example.com', status: 'active', createdAt: '2025-01-08T12:00:00Z', lastLogin: '2025-02-01T07:45:00Z' },
  { id: '5', name: 'Anna Schmidt', email: 'anna.schmidt@example.com', status: 'banned', createdAt: '2025-01-05T09:00:00Z', lastLogin: '2025-01-20T14:00:00Z', banReason: 'Terms of service violation' },
  { id: '6', name: 'James Wilson', email: 'james.w@example.com', status: 'active', createdAt: '2025-01-03T16:00:00Z', lastLogin: null },
  { id: '7', name: 'Elena Rossi', email: 'elena.rossi@example.com', status: 'active', createdAt: '2024-12-28T11:00:00Z', lastLogin: '2025-01-30T18:00:00Z' },
  { id: '8', name: 'Thomas Fischer', email: 'thomas.f@example.com', status: 'suspended', createdAt: '2024-12-20T09:00:00Z', lastLogin: '2025-01-15T10:30:00Z' },
  { id: '9', name: 'Marie Laurent', email: 'marie.laurent@example.com', status: 'active', createdAt: '2024-12-15T14:00:00Z', lastLogin: '2025-02-01T08:00:00Z' },
  { id: '10', name: 'David Chen', email: 'david.chen@example.com', status: 'active', createdAt: '2024-12-10T10:00:00Z', lastLogin: '2025-01-29T12:00:00Z' }
];

function cloneStore(): JobSeeker[] {
  return store.map((s) => ({ ...s }));
}

/** Get all job seekers. Returns a copy so UI cannot mutate the store. */
export function getJobSeekers(): JobSeeker[] {
  return cloneStore();
}

/** Update a job seeker's status (active | suspended). For ban, use banJobSeeker. */
export function updateJobSeekerStatus(id: string, status: 'active' | 'suspended'): void {
  const i = store.findIndex((s) => s.id === id);
  if (i === -1) return;
  store[i] = { ...store[i], status };
  if (status === 'active') {
    delete (store[i] as Partial<JobSeeker>).banReason;
  }
}

/** Ban a job seeker with an optional reason. */
export function banJobSeeker(id: string, reason?: string): void {
  const i = store.findIndex((s) => s.id === id);
  if (i === -1) return;
  store[i] = { ...store[i], status: 'banned', banReason: reason ?? undefined };
}

/** Permanently remove a job seeker from the mock store. */
export function deleteJobSeeker(id: string): void {
  store = store.filter((s) => s.id !== id);
}
