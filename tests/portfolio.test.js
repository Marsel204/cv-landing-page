import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { selectProjects } from "../portfolio.js";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)];
const hasClass = (attributes, name) =>
  new RegExp(`class="[^"]*\\b${name}\\b[^"]*"`).test(attributes);
const projects = articles
  .filter(([_, attributes]) => hasClass(attributes, "project"))
  .map(([_, attributes, body]) => ({
    categories: attributes.match(/data-category="([^"]+)"/)[1].split(" "),
    more: /\bdata-more\b/.test(attributes),
    key: body.match(/data-project="([^"]+)"/)[1],
  }));

test("Selected projects show three entries; expanding reveals all six in order", () => {
  assert.equal(projects.length, 6);
  assert.deepEqual(
    selectProjects(projects).map((project) => project.key),
    ["deploy", "rca", "fuzzy"],
  );
  assert.deepEqual(
    selectProjects(projects, "all", true).map((project) => project.key),
    ["deploy", "rca", "fuzzy", "suite", "elevator", "cad"],
  );
});

test("Category filters include matching additional projects without needing expansion", () => {
  assert.deepEqual(
    selectProjects(projects, "embedded").map((project) => project.key),
    ["deploy", "fuzzy", "suite"],
  );
  assert.deepEqual(
    selectProjects(projects, "ai").map((project) => project.key),
    ["deploy", "rca", "suite"],
  );
  assert.deepEqual(
    selectProjects(projects, "industrial").map((project) => project.key),
    ["rca", "elevator", "cad"],
  );
  assert.deepEqual(selectProjects(projects, "unknown"), []);
  assert.deepEqual(
    [...html.matchAll(/data-filter="([^"]+)"/g)].map((match) => match[1]),
    ["all", "embedded", "ai", "industrial"],
  );
});

test("Filtering preserves project data and returns an independent result", () => {
  const snapshot = structuredClone(projects);
  const result = selectProjects(projects, "all", true);
  result.pop();
  assert.deepEqual(projects, snapshot);
});

test("Certificates are on display, including four distinct laboratory appointments", () => {
  const certificates = articles.filter(([_, attributes]) =>
    hasClass(attributes, "credential"),
  );
  assert.equal(certificates.length, 8);
  const images = certificates.map(([_, attributes, body]) => {
    assert.doesNotMatch(attributes, /\bhidden\b/);
    assert.doesNotMatch(body, /<details\b/);
    assert.match(body, /data-certificate=/);
    const image = body.match(/<img\b[^>]*src="([^"]+)"[^>]*>/)[0];
    assert.match(image, /alt="[^"]+"/);
    return image.match(/src="([^"]+)"/)[1];
  });
  assert.equal(new Set(images).size, 8);
  for (const filename of [
    "cert_lab_fisika.png",
    "cert_lab_sisdig.png",
    "cert_lab_rangkaian.png",
    "cert_lab_elektronika.png",
  ]) {
    assert.ok(images.includes(`assets/${filename}`));
  }
});

test("Native section navigation resolves to unique destinations and puts projects before skills", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [_, destination] of html.matchAll(/href="#([^"]+)"/g))
    assert.ok(ids.includes(destination), destination);
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="skills"'));
  assert.match(html, /<a[^>]+href="#main"[^>]*>Skip to content<\/a>/);
});

test("Dialogs have accessible titles and explicit close controls", () => {
  const dialogs = [...html.matchAll(/<dialog\b([^>]*)>([\s\S]*?)<\/dialog>/g)];
  assert.equal(dialogs.length, 3);
  for (const [_, attributes, body] of dialogs) {
    const label = attributes.match(/aria-labelledby="([^"]+)"/)[1];
    assert.ok(body.includes(`id="${label}"`));
    assert.match(body, /<button\b[^>]*data-close[^>]*aria-label="Close [^"]+"/);
  }
});

test("Production uses relative site assets and both local CV language options", () => {
  assert.doesNotMatch(html, /@@|data:image|Design preview|127\.0\.0\.1/);
  const localResources = [
    ...html.matchAll(/(?:src|href)="([^"#?:]+)(?:\?[^" ]*)?"/g),
  ].map((match) => match[1]);
  for (const resource of localResources)
    assert.ok(
      fs.statSync(new URL(`../${resource}`, import.meta.url)).size > 0,
      resource,
    );
  for (const resource of [
    "cv-english.html",
    "cv-mahasiswa.html",
    "CV_Marselinus_Allen_Nugraha_EN.pdf",
    "CV_Marselinus_Allen_Nugraha.pdf",
  ])
    assert.ok(localResources.includes(resource));
  assert.match(html, /<script\s+type="module"\s+src="portfolio\.js\?/);
});
