# Source mapping

Reference revision: `19905b75dbea89fbfd424d67fe26c81aaed0e018`. Extraction source: `OurPoker/recipe/` (read-only).

- `implementation/server/random.ts` <- `server/src/cards.ts:29-37` (Fisher-Yates `shuffle(items, rng)`), `server/src/engine.ts:139` (`Deps = { rng: () => number; now }`) and the places the engine draws from `rng`: `engine.ts:376` (seat shuffle), `engine.ts:633` (random first button), `engine.ts:653` (deck shuffle), `engine.ts:836` (computer thinking time).
  - Kept: the algorithm and the `() => number` in [0, 1) shape, so `source.next` drops in where the engine's `deps.rng` was. Same loop direction (`i` from the end), so a given sequence of numbers gives the same arrangement as the recipe.
  - Generalised: the injected function is now one of two built-in generators behind a `RandomSource` object (`next`, `int`, `shuffle`, `pick`); `int` and `pick` replace the recipe's inline `Math.floor(rng() * n)` calls (`engine.ts:633`, `836`).
  - Added, not in the recipe: Mulberry32 seeded generator, FNV-1a text seed, 53-bit crypto-backed generator, and `createSource` driven by the `source` and `seed` settings. The recipe injected `Math.random` or a test function from outside the engine and had no seedable or crypto generator of its own.
  - Left behind: everything else in `cards.ts` (card codes, deck, rank names) belongs to `card-deck`.
- `tests/fixtures/seeded.json`: values produced by this component's own `mulberry32(1)` (first value 0.6270739405881613 matches the published Mulberry32 reference for seed 1) and a fixed shuffle for the text seed `fixture`.
- `examples/consumer.ts`: new; shows a consumer taking a source from settings.
- 0.2.0: documentation of the `seed` setting grammar and two added tests; no code changed.
