"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function loadScript(relativePath, context) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

function createElementStub(value = "") {
  return {
    value,
    textContent: "",
    hidden: false,
    readOnly: false,
    style: {},
    className: "",
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
      toggle() {}
    },
    addEventListener() {},
    appendChild() {},
    removeChild() {},
    click() {},
    select() {},
    scrollIntoView() {},
    setAttribute() {},
    removeAttribute() {}
  };
}

function createDomStub(options = {}) {
  const bodyClasses = new Set(
    String(options.bodyClass || "")
      .split(/\s+/)
      .filter(Boolean)
  );

  const elements = options.elements || {};

  return {
    addEventListener() {},
    getElementById(id) {
      return Object.prototype.hasOwnProperty.call(elements, id)
        ? elements[id]
        : null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return createElementStub();
    },
    execCommand() {
      return true;
    },
    body: {
      classList: {
        contains(name) {
          return bodyClasses.has(name);
        },
        toggle(name, active) {
          if (active) bodyClasses.add(name);
          else bodyClasses.delete(name);
        }
      },
      appendChild() {},
      removeChild() {}
    }
  };
}

function createContext(options = {}) {
  const windowObject = {
    isSecureContext: true,
    speechSynthesis: {
      cancel() {},
      speak() {}
    }
  };

  const context = {
    console,
    window: windowObject,
    document: createDomStub(options),
    navigator: {
      clipboard: {
        writeText() {
          return Promise.resolve();
        }
      }
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {}
    },
    Blob: function BlobStub() {},
    URL: {
      createObjectURL() {
        return "blob:stub";
      },
      revokeObjectURL() {}
    },
    SpeechSynthesisUtterance: function SpeechSynthesisUtteranceStub(text) {
      this.text = text;
    },
    setTimeout(callback) {
      if (typeof callback === "function") callback();
      return 0;
    },
    clearTimeout() {}
  };

  windowObject.window = windowObject;
  windowObject.document = context.document;
  windowObject.navigator = context.navigator;
  windowObject.localStorage = context.localStorage;

  return vm.createContext(context);
}

function runTest(name, fn) {
  fn();
  console.log(`✓ ${name}`);
}

function loadCleanEngineContext() {
  const context = createContext();
  loadScript("js/text-analyzer.js", context);
  loadScript("js/text-clean-engine.js", context);
  return context;
}

function loadControllerContext(bodyClass = "") {
  const context = createContext({ bodyClass });
  loadScript("js/text-analyzer.js", context);
  loadScript("js/text-clean-engine.js", context);
  loadScript("js/script.js", context);
  return context;
}

function loadSecondDraftContext() {
  const context = createContext();
  loadScript("js/second-draft.js", context);
  return context;
}

function loadSsmlContext(elements = {}) {
  const defaults = {
    input: createElementStub(),
    cleanOutput: createElementStub(),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub(),
    inputCounter: createElementStub(),
    cleanCounter: createElementStub(),
    ssmlCounter: createElementStub(),
    inputWarning: createElementStub(),
    cleanWarning: createElementStub(),
    ssmlWarning: createElementStub(),
    cleanGenerateBtn: createElementStub(),
    autoChunkBtn: createElementStub()
  };

  const context = createContext({
    elements: {
      ...defaults,
      ...elements
    }
  });

  loadScript("js/ssml-builder.js", context);
  return context;
}

function assertCleaned(input, expected) {
  const context = loadCleanEngineContext();
  const result =
    context.window.PasteLintCleanEngine.runPasteLintCleanup(input).cleanedText;

  assert.strictEqual(result, expected);
}

function testCleanEngineHiddenCharacters() {
  assertCleaned("This text\u200Blooks normal.", "This text looks normal.");
  assertCleaned("hid\u200Bden", "hidden");
  assertCleaned("Hello\u200B, world.", "Hello, world.");
  assertCleaned("support\u200B@example.com", "support@example.com");
  assertCleaned("https://example\u200B.com/path", "https://example.com/path");
  assertCleaned("example\u200B.com", "example.com");
}

function testScriptHiddenPageStructure() {
  const context = loadControllerContext("hidden-characters-page");
  const input = [
    "This text\u200Blooks normal but contains hidden spacing.",
    "",
    "This line uses nonbreaking spaces.",
    "",
    "support\u200B@example.com",
    "",
    "https://example\u200B.com/path"
  ].join("\n");

  const expected = [
    "This text looks normal but contains hidden spacing.",
    "",
    "This line uses nonbreaking spaces.",
    "",
    "support@example.com",
    "",
    "https://example.com/path"
  ].join("\n");

  const result = context.getCleanResult(input, "standard", "paragraph").text;
  assert.strictEqual(result, expected);
}

function testScriptPdfPostProcessing() {
  const context = loadControllerContext("pdf-paste-page");

  const cases = [
    {
      input: [
        "This is a sentence that",
        "was copied from a PDF and",
        "breaks in the middle of the",
        "thought."
      ].join("\n"),
      expected:
        "This is a sentence that was copied from a PDF and breaks in the middle of the thought."
    },
    {
      input: [
        "Section 4.2    Results",
        "The report found    inconsistent spacing",
        "across copied text."
      ].join("\n"),
      expected:
        "Section 4.2 Results\nThe report found inconsistent spacing across copied text."
    },
    {
      input: [
        "First paragraph line one",
        "continues here.",
        "",
        "Second paragraph line one",
        "continues here."
      ].join("\n"),
      expected:
        "First paragraph line one continues here.\n\nSecond paragraph line one continues here."
    },
    {
      input: ["\u2022 First item", "\u2022 Second item", "\u2022 Third item"].join("\n"),
      expected: "\u2022 First item\n\u2022 Second item\n\u2022 Third item"
    },
    {
      input: ["1. First item", "2. Second item", "3. Third item"].join("\n"),
      expected: "1. First item\n2. Second item\n3. Third item"
    }
  ];

  cases.forEach(({ input, expected }) => {
    const result = context.getCleanResult(input, "pdf", "paragraph").text;
    assert.strictEqual(result, expected);
  });
}

function testSecondDraftRewrites() {
  const context = loadSecondDraftContext();
  const input = [
    "I just wanted to reach out and say that we should probably take a look at the draft before sending it over. I think there are a few areas where the wording could be improved, and it may be helpful to make it a little clearer and more concise.",
    "",
    "Also, I wanted to mention that the current version feels a bit long and maybe slightly repetitive in certain places. The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural.",
    "",
    "Let me know if you think this is something we should handle today or if it can wait until tomorrow."
  ].join("\n");

  const result = context.reviseSecondDraft(input, {
    tone: "direct",
    length: "shorter",
    reflow: false
  }).text;

  ["I reach out", "improved,.", "Also, The", "and Make"].forEach((forbidden) => {
    assert.ok(!result.includes(forbidden), `Unexpected phrase: ${forbidden}`);
  });

  [
    "Review the draft before sending it over.",
    "The wording could be clearer and more concise.",
    "The current version feels long and repetitive in places.",
    "Tell me whether we should handle this today or tomorrow."
  ].forEach((expected) => {
    assert.ok(result.includes(expected), `Missing expected phrase: ${expected}`);
  });
}

function testSsmlCleanup() {
  const context = loadSsmlContext();

  assert.ok(
    context.cleanText("otbs@rhpl.org").includes("O T B S at R H P L dot org")
  );
  assert.ok(context.cleanText("rhpl.org").includes("R H P L dot org"));
  assert.ok(
    context.cleanText("support@library.org").includes("support at library dot org")
  );
  assert.notStrictEqual(context.formatHeading("In this issue:"), "In this issue:.");
  assert.ok(!context.cleanText("Leader Dogs for the Blind\u00AE").includes("\u00AE"));
  assert.ok(context.cleanText("DB134728").includes("DB 1-3-4-7-2-8"));
}

function testSsmlGenerateFromCleanedText() {
  const approvedText = [
    "Welcome to the Oakland Talking Book Service.",
    "",
    "or toll free at 8-0-7, 7-7-4, 4-5-4-2",
    "",
    "Visit O T B S dot R H P L dot org."
  ].join("\n");

  const elements = {
    input: createElementStub("Raw text that should not be used."),
    cleanOutput: createElementStub(approvedText),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub()
  };

  const context = loadSsmlContext(elements);
  context.generateSsmlFromCleanedText();

  const output = elements.ssmlOutput.value;
  assert.ok(output.includes("<speak>"));
  assert.ok(output.includes("<prosody rate=\"94%\">"));
  assert.ok(output.includes("or toll free at 8-0-7, 7-7-4, 4-5-4-2"));
  assert.ok(output.includes("Visit O T B S dot R H P L dot org."));
  assert.ok(!output.includes("DB "));
  assert.ok(!output.includes("Raw text that should not be used."));
}

function main() {
  runTest("Hidden characters", testCleanEngineHiddenCharacters);
  runTest("Hidden-character page structure", testScriptHiddenPageStructure);
  runTest("PDF paste reflow", testScriptPdfPostProcessing);
  runTest("SecondDraft rewrites", testSecondDraftRewrites);
  runTest("SSML cleanup", testSsmlCleanup);
  runTest("SSML generate from cleaned text", testSsmlGenerateFromCleanedText);

  console.log("All regression checks passed.");
}

main();
