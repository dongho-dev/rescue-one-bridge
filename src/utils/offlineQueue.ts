import type { CreateRequestData } from '@/hooks/useRequests';

const QUEUE_KEY = 'r1b_offline_queue';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

export interface QueuedRequest {
  id: string;
  data: CreateRequestData;
  userId: string;
  queuedAt: string;
}

/** Remove items older than 24h */
function pruneStale(items: QueuedRequest[]): QueuedRequest[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return items.filter(item => new Date(item.queuedAt).getTime() > cutoff);
}

export function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const items: QueuedRequest[] = JSON.parse(raw);
    const pruned = pruneStale(items);
    // Persist pruned list if items were removed
    if (pruned.length !== items.length) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return [];
  }
}

export function enqueue(data: CreateRequestData, userId: string): QueuedRequest {
  // Sanitize: strip patient_name from stored data (store only minimal info)
  const sanitized = { ...data };
  if (sanitized.patient_name) {
    sanitized.patient_name = sanitized.patient_name.substring(0, 1) + '**';
  }

  const item: QueuedRequest = {
    id: crypto.randomUUID(),
    data: sanitized,
    userId,
    queuedAt: new Date().toISOString(),
  };
  const queue = getQueue();
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return item;
}

export function dequeue(id: string): void {
  const queue = getQueue().filter(item => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
