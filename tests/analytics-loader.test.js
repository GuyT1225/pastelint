"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const dispatcherModule = require("../js/analytics-event-dispatcher.js");

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
  "journal-editors-desk-clean-up-chatgpt-text-without-overwriting-your-voice.html",
  "journal-editors-desk-clearer-is-not-more-certain.html",
  "journal-editors-desk-filler-openings.html",
  "journal-editors-desk-record-behind-product-transparency.html",
  "journal-editors-desk-text-readiness-is-a-handoff-discipline.html",
  "journal-engine-room-directness-without-false-certainty.html",
  "journal-engine-room-line-breaks-are-part-of-the-meaning.html",
  "journal-engine-room-prepared-handoff-is-not-accepted-outcome.html",
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

function runLoader(href, initialStorage = {}, storageOverrides = {}) {
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
  const storageApi = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, value); },
    removeItem(key) { storage.delete(key); },
    ...storageOverrides
  };
  const context = vm.createContext({
    URL,
    window: { location: { href } },
    document,
    localStorage: storageApi,
    history: {
      state: { preserved: true },
      replaceState(state, title, url) { replacements.push({ state, title, url }); }
    },
    console: { info(message) { logs.push(message); } }
  });

  vm.runInContext(LOADER, context, { filename: "js/analytics-loader.js" });
  return { storage, appended, replacements, logs };
}

function testExcludedState() {
  const result = runLoader("https://pastelint.com/index.html?foo=1&analytics=exclude#tools");
  assert.strictEqual(result.storage.get(STORAGE_KEY), "excluded");
  assert.strictEqual(result.appended.length, 0);
  assert.strictEqual(result.replacements.length, 1);
  assert.strictEqual(result.replacements[0].url, "/index.html?foo=1#tools");
  assert.deepStrictEqual(result.logs, ["[PasteLint] Analytics preference: excluded for this browser."]);
}

function testIncludedState() {
  const result = runLoader("https://pastelint.com/second-draft.html?analytics=include&mode=shorter#editor", {
    [STORAGE_KEY]: "excluded"
  });
  assert.strictEqual(result.storage.has(STORAGE_KEY), false);
  assert.strictEqual(result.appended.length, 0);
  assert.strictEqual(result.replacements[0].url, "/second-draft.html?mode=shorter#editor");
  assert.deepStrictEqual(result.logs, ["[PasteLint] Analytics preference: included for this browser."]);
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
  assert.strictEqual(result.appended.length, 0);
  assert.strictEqual(result.replacements.length, 0);
  assert.strictEqual(result.logs.length, 0);
}

function testAmbiguousAndMalformedControlsFailClosed() {
  for (const controls of [
    "include&analytics=exclude",
    "exclude&analytics=include",
    "include&analytics=include",
    "exclude&analytics=exclude",
    "unknown",
    ""
  ]) {
    const result = runLoader(`https://pastelint.com/index.html?analytics=${controls}`);
    assert.strictEqual(result.storage.get(STORAGE_KEY), "excluded", controls);
    assert.strictEqual(result.replacements.length, 1, controls);
    assert.deepStrictEqual(
      result.logs,
      ["[PasteLint] Analytics preference: excluded for this browser."],
      controls
    );
  }
}

function testExistingExclusionSurvivesAmbiguousControls() {
  for (const controls of ["include&analytics=exclude", "include&analytics=include", "unexpected"]) {
    const result = runLoader(
      `https://pastelint.com/index.html?analytics=${controls}`,
      { [STORAGE_KEY]: "excluded" }
    );
    assert.strictEqual(result.storage.get(STORAGE_KEY), "excluded", controls);
  }
}

function testStorageFailuresDoNotClearExclusion() {
  const throwingRemoval = runLoader(
    "https://pastelint.com/index.html?analytics=include",
    { [STORAGE_KEY]: "excluded" },
    { removeItem() { throw new Error("blocked"); } }
  );
  assert.strictEqual(throwingRemoval.storage.get(STORAGE_KEY), "excluded");
  assert.strictEqual(throwingRemoval.replacements.length, 0);
  assert.strictEqual(throwingRemoval.logs.length, 0);

  const silentRemoval = runLoader(
    "https://pastelint.com/index.html?analytics=include",
    { [STORAGE_KEY]: "excluded" },
    { removeItem() {} }
  );
  assert.strictEqual(silentRemoval.storage.get(STORAGE_KEY), "excluded");
  assert.strictEqual(silentRemoval.replacements.length, 0);

  for (const setItem of [
    () => { throw new Error("blocked"); },
    () => {}
  ]) {
    const failedWrite = runLoader(
      "https://pastelint.com/index.html?analytics=exclude",
      {},
      { setItem }
    );
    assert.strictEqual(failedWrite.storage.has(STORAGE_KEY), false);
    assert.strictEqual(failedWrite.replacements.length, 0);
  }
}

function testNoProviderDependency() {
  assert.ok(!/statskit\.ai|workers\.dev|sendBeacon|\bfetch\s*\(/i.test(LOADER));
  const context = vm.createContext({ URL, window: { location: { href: 'https://example.com/?analytics=exclude' } }, localStorage: { setItem() { throw new Error('blocked'); } } });
  vm.runInContext(LOADER, context);
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

function testCombinedConflictingControlsFailClosed() {
  for (const controls of ["include&analytics=exclude", "exclude&analytics=include"]) {
    const storage = new Map([[STORAGE_KEY, "excluded"]]);
    const browser = {
      document: {},
      location: { href: `https://pastelint.com/pastelint/?analytics=${controls}` }
    };
    browser.localStorage = {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); }
    };
    browser.history = {
      state: null,
      replaceState(_state, _title, url) {
        browser.location.href = new URL(url, browser.location.href).href;
      }
    };

    vm.runInContext(LOADER, vm.createContext({
      URL,
      window: browser,
      localStorage: browser.localStorage,
      history: browser.history,
      console: { info() {} }
    }));

    const events = [];
    const dispatcher = dispatcherModule.initialize(
      browser,
      { enabled: true, allowedOrigin: "https://pastelint.com" },
      (payload) => events.push(payload)
    );
    assert.strictEqual(dispatcher.dispatch("tool_start"), false, controls);
    assert.strictEqual(storage.get(STORAGE_KEY), "excluded", controls);
    assert.deepStrictEqual(events, [], controls);
  }
}

testExcludedState();
testIncludedState();
testPersistedExcludedState();
testNormalPublicState();
testAmbiguousAndMalformedControlsFailClosed();
testExistingExclusionSurvivesAmbiguousControls();
testStorageFailuresDoNotClearExclusion();
testNoProviderDependency();
testPageCoverage();
testCombinedConflictingControlsFailClosed();
console.log("Analytics loader checks passed.");
