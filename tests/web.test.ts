import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createSource, mulberry32, randomInt, secureNext, secureSource, seededSource, seedFromText, shuffle, sourceFrom} from "../implementation/server/random.ts";
import {replayable} from "../examples/consumer.ts";

const fixture = JSON.parse(readFileSync(new URL("fixtures/seeded.json", import.meta.url), "utf8"));

test("mulberry32 reproduces the reference sequence for a seed", () => {
  const next = mulberry32(1);
  for (const expected of fixture.seedOneFirstFive) assert.equal(next(), expected);
});

test("text seeds are fixed numbers and replay the same shuffle", () => {
  assert.equal(seedFromText(fixture.textSeed.text), fixture.textSeed.seed);
  const ten = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  assert.deepEqual(seededSource("fixture").shuffle(ten), fixture.shuffleTenFromFixtureSeed);
  assert.deepEqual(replayable("a"), replayable("a"));
  assert.notDeepEqual(replayable("a"), replayable("b"));
});

test("shuffle is a permutation and leaves its input alone", () => {
  const input = Array.from({length: 52}, (_, i) => i);
  const copy = [...input];
  const out = shuffle(input, mulberry32(7));
  assert.deepEqual(input, copy);
  assert.deepEqual([...out].sort((a, b) => a - b), copy);
  assert.notDeepEqual(out, copy);
  assert.deepEqual(shuffle([], mulberry32(1)), []);
  assert.deepEqual(shuffle(["x"], mulberry32(1)), ["x"]);
});

test("every arrangement of three items turns up about equally often", () => {
  const counts = new Map<string, number>();
  const next = mulberry32(12345);
  const runs = 60000;
  for (let i = 0; i < runs; i++) {
    const key = shuffle(["a", "b", "c"], next).join("");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  assert.equal(counts.size, 6);
  for (const count of counts.values()) assert.ok(Math.abs(count - runs / 6) < runs / 6 * 0.05, `count ${count}`);
});

test("randomInt stays within bounds and rejects bad bounds", () => {
  assert.equal(randomInt(() => 0.9999999, 5), 4);
  assert.equal(randomInt(() => 0, 5), 0);
  assert.equal(randomInt(() => 1, 5), 4);
  for (const bad of [0, -1, 1.5, NaN]) assert.throws(() => randomInt(() => 0.5, bad), RangeError);
  assert.equal(seededSource(3).int(1), 0);
});

test("pick chooses from the list and refuses an empty one", () => {
  assert.equal(sourceFrom(() => 0.5).pick(["a", "b", "c", "d"]), "c");
  assert.throws(() => sourceFrom(() => 0.5).pick([]), RangeError);
});

test("secure source reads 53 bits from the injected crypto and stays in [0, 1)", () => {
  const ones = {getRandomValues: <T extends ArrayBufferView>(a: T) => {(a as unknown as Uint32Array).fill(0xffffffff); return a;}};
  const zeros = {getRandomValues: <T extends ArrayBufferView>(a: T) => {(a as unknown as Uint32Array).fill(0); return a;}};
  assert.equal(secureNext(zeros)(), 0);
  const top = secureNext(ones)();
  assert.ok(top < 1 && top > 0.9999999999999998);
  const real = secureSource().next();
  assert.ok(real >= 0 && real < 1);
  assert.throws(() => secureNext({} as never), /no cryptographic/);
});

test("createSource follows the settings", () => {
  assert.deepEqual(createSource({source: "seeded", seed: "q"}).shuffle([1, 2, 3, 4]), createSource({source: "seeded", seed: "q"}).shuffle([1, 2, 3, 4]));
  assert.throws(() => createSource({source: "seeded"}), /needs a seed/);
  assert.throws(() => createSource({source: "weird" as never}), /unknown source/);
  assert.equal(typeof createSource({source: "secure"}).next(), "number");
});

test("a seed given as an installer setting is text that starts with a letter (label grammar) and replays the same deal", () => {
  const deal = (seed: string) => createSource({source: "seeded", seed}).shuffle(Array.from({length: 52}, (_, i) => i));
  for (const seed of ["replay-7", "Table one", "a"]) {
    assert.deepEqual(deal(seed), deal(seed), seed);
    assert.match(seed, /^[A-Za-z][A-Za-z0-9 -]{0,63}$/);
  }
  assert.notDeepEqual(deal("replay-7"), deal("replay-8"));
});

test("the source's shuffle is the one-argument shuffle(items) that card-deck requires, and works detached", () => {
  const {shuffle: detached} = seededSource("detached");
  const out = detached([1, 2, 3, 4, 5]);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});
