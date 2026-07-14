type QueuedOperation = {
  id: string;
  type: 'gas-test' | 'isolation-confirmation' | 'photo-upload';
  permitId: string;
  payload: unknown;
  createdAt: string;
};

const queueKey = 'psm-os:ptw:offline-queue';
const cachedPermitKey = (permitId: string) => `psm-os:ptw:permit:${permitId}`;

export const ptwOfflineStore = {
  cachePermit(permitId: string, permit: unknown) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(cachedPermitKey(permitId), JSON.stringify({ permit, cachedAt: new Date().toISOString() }));
  },
  getCachedPermit<T>(permitId: string): T | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(cachedPermitKey(permitId));
    if (!raw) return null;
    try {
      return JSON.parse(raw).permit as T;
    } catch {
      return null;
    }
  },
  enqueue(operation: Omit<QueuedOperation, 'id' | 'createdAt'>) {
    if (typeof window === 'undefined') return;
    const queue = this.queue();
    queue.push({ ...operation, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    window.localStorage.setItem(queueKey, JSON.stringify(queue));
    window.dispatchEvent(new Event('ptw-offline-queue-change'));
  },
  queue(): QueuedOperation[] {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(queueKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedOperation[];
    } catch {
      return [];
    }
  },
  clearQueue() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(queueKey);
    window.dispatchEvent(new Event('ptw-offline-queue-change'));
  }
};
