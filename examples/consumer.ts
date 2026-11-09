import {createSource} from "../implementation/server/random.ts";

// A game asks its settings for a source and shuffles with it; tests pass `seeded` and replay.
export function shuffledNumbers(count: number, source: ReturnType<typeof createSource>): number[] {
  return source.shuffle(Array.from({length: count}, (_, i) => i));
}

export function replayable(seed: string): number[] {
  return shuffledNumbers(10, createSource({source: "seeded", seed}));
}
