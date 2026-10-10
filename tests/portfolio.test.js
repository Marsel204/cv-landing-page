import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { selectProjects } from "../portfolio.js";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)];
const hasClass = (attributes, name) =>
  new RegExp(`class="[^"]*\\b${name}\\b[^"]*"`).test(attributes);
const projects = articles
  .filter(([_, attributes]) => hasClass(attributes, "project-card"))
  .map(([_, attributes, body]) => ({
    categories: attributes.match(/data-category="([^"]+)"/)[1].split(" "),
    key: body.match(/data-project="([^"]+)"/)[1],
  }));

test("All eleven approved projects are available in the carousel in portfolio order", () => {
  assert.equal(projects.length, 11);
  assert.deepEqual(
    selectProjects(projects).map((project) => project.key),
    ["deploy", "rca", "fuzzy", "visionlab", "biometric", "elevator", "cad", "suite", "fis", "linguaplay", "agentic"],
  );
});

test("Category filters include every relevant project and the software category", () => {
  assert.deepEqual(
    selectProjects(projects, "embedded").map((project) => project.key),
    ["deploy", "fuzzy", "biometric", "suite"],
  );
  assert.deepEqual(
    selectProjects(projects, "ai").map((project) => project.key),
    ["deploy", "rca", "visionlab", "biometric", "suite", "fis", "linguaplay"],
  );
  assert.deepEqual(
    selectProjects(projects, "industrial").map((project) => project.key),
    ["rca", "elevator", "cad"],
  );
  assert.deepEqual(selectProjects(projects, "unknown"), []);
  assert.deepEqual(
    selectProjects(projects, "software").map((project) => project.key),
    ["visionlab", "linguaplay", "agentic"],
  );
  assert.deepEqual(
    [...html.matchAll(/data-filter="([^"]+)"/g)].map((match) => match[1]),
    ["all", "embedded", "ai", "industrial", "software"],
  );
});

test("Filtering preserves project data and returns an independent result", () => {
  const snapshot = structuredClone(projects);
  const result = selectProjects(projects);
  result.pop();
  assert.deepEqual(projects, snapshot);
});

test("Every project has a complete overview with aligned workflow steps and valid links", () => {
  const data = JSON.parse(html.match(/<script id="project-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(Object.keys(data).sort(), projects.map(project => project.key).sort());
  for (const project of Object.values(data)) {
    for (const field of ["title", "summary", "overview", "problem", "contribution", "approach", "outcome", "evidence", "alt", "caption"])
      assert.ok(typeof project[field] === "string" && project[field].trim().length > 0, `${project.id}: ${field}`);
    assert.equal(project.features.length, 4);
    assert.ok(project.features.every(feature => feature.length === 2 && feature.every(value => typeof value === "string" && value.trim())));
    assert.equal(project.flow.length, project.workflowDetails.length);
    assert.ok(project.workflowDetails.every(value => typeof value === "string" && value.trim()));
    assert.ok(project.tags.length > 0);
    if (project.url) assert.ok(project.url.startsWith("https://github.com/Marsel204/"));
    if (project.source) assert.ok(project.source.startsWith("https://github.com/Marsel204/"));
  }
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
