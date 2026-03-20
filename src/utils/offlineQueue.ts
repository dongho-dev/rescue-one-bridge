import type { CreateRequestData } from '@/hooks/useRequests';

const QUEUE_KEY = 'r1b_offline_queue';

export interface QueuedRequest {
  id: string;
  data: CreateRequestData;
  userId: string;
  queuedAt: string;
}

export function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueue(data: CreateRequestData, userId: string): QueuedRequest {
  const item: QueuedRequest = {
    id: crypto.randomUUID(),
    data,
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
