import { buildSeed, DEMO_DB_VERSION, type DemoDB } from '@/lib/demo/seed';

const DB_KEY = 'swapstay.demo.db';
const MODE_KEY = 'swapstay.demo.mode';
const OPT_OUT_KEY = 'swapstay.demo.optOut';
const ENV_DEFAULT = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable (private mode); demo still works in memory */
  }
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (safeGet(MODE_KEY) === '1') return true;
  return ENV_DEFAULT && safeGet(OPT_OUT_KEY) !== '1';
}

export function enterDemoMode() {
  if (typeof window === 'undefined') return;
  safeSet(MODE_KEY, '1');
  safeSet(OPT_OUT_KEY, null);
}

export function exitDemoMode() {
  if (typeof window === 'undefined') return;
  safeSet(MODE_KEY, null);
  safeSet(OPT_OUT_KEY, '1');
}

let memoryDb: DemoDB | null = null;

export function getDemoDB(): DemoDB {
  if (typeof window === 'undefined') {
    memoryDb = memoryDb ?? buildSeed();
    return memoryDb;
  }

  const raw = safeGet(DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DemoDB;
      if (parsed?.version === DEMO_DB_VERSION) {
        memoryDb = parsed;
        return parsed;
      }
    } catch {
      /* fall through to a fresh seed */
    }
  }

  const seeded = buildSeed();
  memoryDb = seeded;
  safeSet(DB_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveDemoDB(db: DemoDB) {
  memoryDb = db;
  if (typeof window === 'undefined') return;
  safeSet(DB_KEY, JSON.stringify(db));
}

export function resetDemoDB() {
  const seeded = buildSeed();
  memoryDb = seeded;
  if (typeof window !== 'undefined') safeSet(DB_KEY, JSON.stringify(seeded));
  return seeded;
}
