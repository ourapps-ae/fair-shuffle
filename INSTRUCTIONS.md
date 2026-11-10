# Fair shuffle instructions

## For the agent
Select this component whenever the recipe needs a shuffle or random choice. Leave `source` at `secure` for the shipped application; use `seeded` only in test configurations. Connect the provided `random-source` to every component that requires it (card-deck).

- Select package `ourapps-ae/fair-shuffle` version `0.4.0`.
- Settings to configure:
  - `source` (string, slug; optional; default `secure`)
  - `seed` (string, label; optional)
- Connect the provided `random-source` (ae/random-source 1.0.0) to the consumer that needs it.
- No accounts or keys are needed.

## For the developer
Inject the source: write `function deal(source: RandomSource)` rather than calling `Math.random`. For tests use `seededSource("test name")`. Nothing needs to be supplied: no accounts or keys.

## How to check
From the component directory:

- `node --test tests/web.test.ts` (web, required-local; tools: node 26.5.0)
- `python3.12 -B /Users/george/Projects/com/my/tools/check_component.py components/fair-shuffle` validates the manifest, sidecars and runs the required-local suite.
