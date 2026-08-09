"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const LOADER = fs.readFileSync(path.join(ROOT, "js", "analytics-loader.js"), "utf8");
const STORAGE_KEY = "pastelint_internal_analytics";
const EXPECTED_PAGES = [
  "clean-chatgpt-output.html",
  "clean-text-message.html",
  "contact.html",
  "fix-pdf-paste.html",
  "index.html",
  "internal-marker.html",
  "ivr-text-prep.html",
  "journal-cleanup-pass-voice-survives.html",
  "journal-content-pipeline-breaks-before-writing.html",
  "journal-editors-desk-clearer-is-not-more-certain.html",
  "journal-editors-desk-filler-openings.html",
  "journal-editors-desk-record-behind-product-transparency.html",
  "journal-editors-desk-text-readiness-is-a-handoff-discipline.html",
  "journal-engine-room-directness-without-false-certainty.html",
  "journal-engine-room-line-breaks-are-part-of-the-meaning.html",
  "journal-engine-ssml-catalog-chunks.html",
  "journal-sources-case-studies-editors-optimize-for-readers.html",
  "journal-sources-case-studies-first-draft-finds-the-story.html",
  "journal-sources-case-studies-the-new-bottleneck-is-taste.html",
  "journal-sources-case-studies-tutor-not-ghostwriter.html",
  "journal-tracing-with-the-model.html",
  "privacy.html",
  "remove-hidden-characters.html",
  "second-draft.html",
  "SSML_builder.html",
  "terms.html",
  "text-preparation-journal.html",
  "text-readiness-framework.html",
  "tts-text-cleanup.html"
];

function runLoader(href, initialStorage = {}) {
  const storage = new Map(Object.entries(initialStorage));
  const appended = [];
  const replacements = [];
  const logs = [];
  const head = { appendChild(node) { appended.push(node); } };
  const document = {
    head,
    documentElement: head,
    createElement(tagName) {
      assert.strictEqual(tagName, "script");
      return {
        defer: false,
        src: "",
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; }
      };
    }
  };
  const context = vm.createContext({
    URL,
    window: { location: { href } },
    document,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); }
    },
    history: {
      state: { preserved: true },
      replaceState(state, title, url) { replacements.push({ state, title, url }); }
    },
    console: { info(message) { logs.push(message); } }
  });

  vm.runInContext(LOADER, context, { filename: "js/analytics-loader.js" });
  return { storage, appended, replacements, logs };
}

function assertStatsKitScript(script) {
  assert.strictEqual(script.async, false);
  assert.strictEqual(script.defer, true);
  assert.strictEqual(script.src, "https://cdn.statskit.ai/v.js");
  assert.strictEqual(script.attributes["data-site-id"], "vpk_live_20e8d5020dab682829ccd0beafbe17c93cacdfd20d14f200");
  assert.strictEqual(script.attributes["data-api"], "https://edge.statskit.ai");
}

function testExcludedState() {
  const result = runLoader("https://pastelint.com/index.html?foo=1&analytics=exclude#tools");
  assert.strictEqual(result.storage.get(STORAGE_KEY), "excluded");
  assert.strictEqual(result.appended.length, 0);
  assert.strictEqual(result.replacements.length, 1);
  assert.strictEqual(result.replacements[0].url, "/index.html?foo=1#tools");
  assert.deepStrictEqual(result.logs, ["[PasteLint] StatsKit analytics excluded for this browser."]);
}

function testIncludedState() {
  const result = runLoader("https://pastelint.com/second-draft.html?analytics=include&mode=shorter#editor", {
    [STORAGE_KEY]: "excluded"
  });
  assert.strictEqual(result.storage.has(STORAGE_KEY), false);
  assert.strictEqual(result.appended.length, 1);
  assertStatsKitScript(result.appended[0]);
  assert.strictEqual(result.replacements[0].url, "/second-draft.html?mode=shorter#editor");
  assert.deepStrictEqual(result.logs, ["[PasteLint] StatsKit analytics included for this browser."]);
}

function testPersistedExcludedState() {
  const result = runLoader("https://pastelint.com/SSML_builder.html#builder", {
    [STORAGE_KEY]: "excluded"
  });
  assert.strictEqual(result.appended.length, 0);
  assert.strictEqual(result.replacements.length, 0);
  assert.strictEqual(result.logs.length, 0);
}

function testNormalPublicState() {
  const result = runLoader("https://pastelint.com/privacy.html?source=footer#analytics");
  assert.strictEqual(result.appended.length, 1);
  assertStatsKitScript(result.appended[0]);
  assert.strictEqual(result.replacements.length, 0);
  assert.strictEqual(result.logs.length, 0);
}

function testPageCoverage() {
  const actualPages = fs.readdirSync(ROOT)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => fs.readFileSync(path.join(ROOT, file), "utf8").includes('src="js/analytics-loader.js"'))
    .sort();

  assert.deepStrictEqual(actualPages, [...EXPECTED_PAGES].sort());
  EXPECTED_PAGES.forEach((file) => {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.ok(!html.includes("https://cdn.statskit.ai/v.js"), `${file} still loads StatsKit directly`);
    assert.strictEqual((html.match(/src="js\/analytics-loader\.js"/g) || []).length, 1);
  });
}

testExcludedState();
testIncludedState();
testPersistedExcludedState();
testNormalPublicState();
testPageCoverage();
console.log("Analytics loader checks passed.");
