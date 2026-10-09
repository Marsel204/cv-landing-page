import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("Materials avoid the previous combined blur and saturation GPU regression", () => {
  const backdropFilters = [
    ...css.matchAll(/backdrop-filter\s*:\s*([^;]+)/g),
  ].map((match) => match[1]);
  assert.ok(backdropFilters.length > 0);
  assert.ok(
    backdropFilters.every(
      (filter) => !(filter.includes("blur(") && filter.includes("saturate(")),
    ),
  );
});

test("Motion, transparency, contrast and keyboard focus preferences remain supported", () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
  assert.match(css, /@media\s*\(prefers-contrast:\s*more\)/);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:/);
});

test("Sticky navigation preserves the document scroll container", () => {
  assert.match(css, /\.site-header\s*\{[^}]*position:\s*sticky/);
  const bodyRules = [...css.matchAll(/(?:^|\})\s*body\s*\{([^}]+)\}/g)].map(
    (match) => match[1],
  );
  assert.ok(
    bodyRules.every((rule) => !/overflow(?:-x)?\s*:\s*hidden/.test(rule)),
  );
});
