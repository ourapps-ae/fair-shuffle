# Fair shuffle component

## Purpose and facilities
Games need two kinds of randomness: unpredictable for real play, and repeatable for tests and replays. This component gives both behind one `RandomSource` (next, int, shuffle, pick). `secure` reads the platform's cryptographic generator; `seeded` runs Mulberry32 from a number or text seed so the same seed always gives the same sequence on every platform. The shuffle is Fisher-Yates over whichever source is injected.

Facilities: `random-source` (Seedable or cryptographic random numbers, integers, picks and shuffles).

## User inputs
The installer collects two settings. `source` is `secure` (default, for play) or `seeded` (for replayable runs and tests). `seed` is the text used when `source` is `seeded`; as an installer setting it is a label (letters, digits, spaces and hyphens, starting with a letter, such as `replay-7`) and is turned into a number by `seedFromText`; code may also pass a number; a seeded source without a seed is refused.

- `source` (string, slug; optional; default `secure`)
- `seed` (string, label; optional)

## Artefacts and dependencies
`component.json` maps every `implementation/` source into `components/fair-shuffle/`:

- `implementation/server/random.ts` -> `components/fair-shuffle/server/random.ts`

Dependencies: none.
`tools.lock.json` pins verification tools: node 26.5.0. Licence: `Apache-2.0` (`LICENCE`, `NOTICE`).

## Provided interfaces
- `interfaces/random-source.json` defines `random-source` (ae/random-source) version 1.0.0: an OpenRPC 1.3.2 document, one method per function (a member of a created object is `<Type>.<member>`), with parameter, result and data types as JSON Schema 2020-12 (`components.schemas`) and thrown errors under `errors`.

## Required interfaces
None.

## Integration
Code that needs randomness takes a `RandomSource` as an argument and never calls `Math.random`. The game engine's `rng: () => number` becomes `source.next`; a function-style generator is wrapped with `sourceFrom`. `card-deck` requires this interface and shuffles through `source.shuffle`. Single platform: server TypeScript. The file uses only standard globals (`crypto`), so it also runs unchanged in a browser, but only the server copy is installed.

## Visual definition and connected examples
`visual/definition.json` maps its ports to the provided and required interfaces. `visual/examples/connected.json` connects the component to an illustrative application consumer. Both image formats and a text description are retained under `visual/output/`.

## Infrastructure
No deployed service and no accounts. The secure source needs the platform's `crypto.getRandomValues` (Node 20 or later, Workers, browsers).

## Verification
`tests/web.test.ts` checks the Mulberry32 reference sequence, replay by seed, shuffle permutation and input immutability, uniformity over all six orders of three items, bounds and error handling, and the secure source with an injected generator and the real one. Also checks that a label-style seed replays the same deal and that the source's `shuffle(items)` works detached, as card-deck calls it.

- `node --test tests/web.test.ts` (web, required-local; tools: node 26.5.0)

## Scenarios and presentation
A test run seeds the source with the test name and expects the same deal every time. A live room uses the secure source. A support engineer replays a disputed deal by recording the seed.

## Updates and removal
Patch updates replace the files only. The sequence produced by a given seed is part of the contract: a change to it is a new major version. Removing the component leaves callers without a random source, so supply another `random-source`.
