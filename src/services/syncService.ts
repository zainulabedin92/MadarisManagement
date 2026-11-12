import { localDb } from './localDb';

type Listener = (state: SyncState) => void;

export interface SyncState {
  pending: number;
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
}

/** Result of replaying a single queued request, supplied by ApiService. */
export type ReplayResult =
  | { kind: 'ok'; data?: any }
  | { kind: 'network' } // still offline -> stop and retry later
  | { kind: 'rejected'; message: string }; // server said no (4xx/5xx)

const state: SyncState = { pending: 0, syncing: false, lastSyncAt: null, lastError: null };
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(l => l({ ...state }));

function extractId(data: any): string | null {
  const obj = data?.data ?? data;
  const cand =
    obj?._id ??
    obj?.id ??
    obj?.student?._id ??
    obj?.teacher?._id ??
    obj?.class?._id ??
    obj?.parent?._id;
  return cand ? String(cand) : null;
}

export const syncService = {
  getState: (): SyncState => ({ ...state }),

  subscribe(l: Listener) {
    listeners.add(l);
    l({ ...state });
    return () => {
      listeners.delete(l);
    };
  },

  refreshPending() {
    try {
      state.pending = localDb.outboxCount();
    } catch {}
    emit();
  },

  /**
   * Push queued offline changes (FIFO) to the Express API, which writes to MongoDB.
   * `replay` performs the HTTP call.
   */
  async flush(replay: (method: string, endpoint: string, body: string | null) => Promise<ReplayResult>) {
    if (state.syncing) return;
    state.syncing = true;
    state.lastError = null;
    emit();
    try {
      for (const item of localDb.outboxAll()) {
        const result = await replay(item.method, item.endpoint, item.body);
        if (result.kind === 'network') break;
        if (result.kind === 'ok') {
          if (item.tempId) {
            const realId = extractId(result.data);
            if (realId) localDb.replaceId(item.tempId, realId);
          }
          localDb.outboxRemove(item.id);
        } else {
          // Rejected by server: record error, drop after 3 attempts so queue never blocks.
          localDb.outboxFail(item.id, result.message);
          state.lastError = result.message;
          if (item.attempts + 1 >= 3) localDb.outboxRemove(item.id);
        }
        state.pending = localDb.outboxCount();
        emit();
      }
      state.lastSyncAt = Date.now();
    } finally {
      state.syncing = false;
      state.pending = localDb.outboxCount();
      emit();
    }
  },
};

