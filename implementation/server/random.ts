// Random numbers behind one interface: a seeded generator tests can replay, and a crypto-backed one.

// A function returning a number in [0, 1), the shape the game engine injects as `rng`.
export type Next = () => number;

export type RandomSource = {
  next: Next;
  // Whole number in [0, bound).
  int(bound: number): number;
  // A shuffled copy (Fisher-Yates); the input is not changed.
  shuffle<T>(items: readonly T[]): T[];
  // One element chosen uniformly; throws on an empty list.
  pick<T>(items: readonly T[]): T;
};

export type CryptoLike = { getRandomValues<T extends ArrayBufferView>(array: T): T };

export type SourceSettings = { source: "secure" | "seeded"; seed?: number | string };

// Mulberry32: 32 bits of state, passes common statistical batteries, identical on every platform.
export function mulberry32(seed: number): Next {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a, so a text seed such as a test name gives a fixed number seed.
export function seedFromText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// 53 random bits from the platform's cryptographic generator, scaled into [0, 1).
export function secureNext(source: CryptoLike = globalThis.crypto): Next {
  if (!source || typeof source.getRandomValues !== "function") throw new Error("no cryptographic random source available");
  const words = new Uint32Array(2);
  return () => {
    source.getRandomValues(words);
    return ((words[0] >>> 5) * 67108864 + (words[1] >>> 6)) / 9007199254740992;
  };
}

export function randomInt(next: Next, bound: number): number {
  if (!Number.isInteger(bound) || bound < 1) throw new RangeError("bound must be a whole number of at least 1");
  return Math.min(bound - 1, Math.floor(next() * bound));
}

export function shuffle<T>(items: readonly T[], next: Next): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(next, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Wrap any function returning numbers in [0, 1) as a source.
export function sourceFrom(next: Next): RandomSource {
  return {
    next,
    int: (bound) => randomInt(next, bound),
    shuffle: (items) => shuffle(items, next),
    pick: (items) => {
      if (items.length === 0) throw new RangeError("cannot pick from an empty list");
      return items[randomInt(next, items.length)];
    },
  };
}

export function seededSource(seed: number | string): RandomSource {
  return sourceFrom(mulberry32(typeof seed === "string" ? seedFromText(seed) : seed));
}

export function secureSource(source?: CryptoLike): RandomSource {
  return sourceFrom(secureNext(source));
}

// Choose from installer settings: `secure` for play, `seeded` (with a seed) for replayable runs.
export function createSource(settings: SourceSettings, source?: CryptoLike): RandomSource {
  if (settings.source === "seeded") {
    if (settings.seed === undefined || settings.seed === "") throw new Error("a seeded source needs a seed");
    return seededSource(settings.seed);
  }
  if (settings.source === "secure") return secureSource(source);
  throw new Error(`unknown source ${String((settings as { source: unknown }).source)}`);
}
