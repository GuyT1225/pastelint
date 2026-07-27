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
    querySelectorAll() {
      return [];
    },
    click() {},
    select() {},
    dispatchEvent() {},
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
  const eventListeners = options.eventListeners || {};

  return {
    addEventListener(type, callback) {
      if (!eventListeners[type]) eventListeners[type] = [];
      eventListeners[type].push(callback);
    },
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
  const documentEvents = options.documentEvents || {};
  const windowObject = {
    isSecureContext: true,
    speechSynthesis: {
      cancel() {},
      speak() {}
    }
  };
  const storage = options.storage || {};

  const context = {
    console,
    window: windowObject,
    document: createDomStub({
      ...options,
      eventListeners: documentEvents
    }),
    __documentEvents: documentEvents,
    navigator: {
      clipboard: {
        writeText() {
          return Promise.resolve();
        }
      }
    },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key)
          ? storage[key]
          : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    },
    Event: function EventStub(type, init = {}) {
      this.type = type;
      this.bubbles = Boolean(init.bubbles);
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

function loadSecondDraftContext(options = {}) {
  const context = createContext(options);
  loadScript("js/second-draft.js", context);
  return context;
}

function loadSecondDraftRuleRegistryContext() {
  const context = createContext();
  loadScript("js/second-draft-rule-registry.js", context);
  return context;
}

function readSecondDraftRuleRegistryData() {
  return JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "data", "second-draft-rules.json"),
      "utf8"
    )
  );
}

function loadSsmlContext(elements = {}, options = {}) {
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
    autoChunkBtn: createElementStub(),
    sectionTitle: createElementStub(),
    footerType: createElementStub("none"),
    previewMode: createElementStub("plain"),
    chunksContainer: createElementStub(),
    chunkSummary: createElementStub(),
    chunkStart: createElementStub()
  };

  const context = createContext({
    elements: {
      ...defaults,
      ...elements
    },
    storage: options.storage,
    documentEvents: options.documentEvents
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
  assertCleaned(
    "This text\u200Bhas a hidden character.",
    "This text has a hidden character."
  );
  assertCleaned("hid\u200Bden", "hidden");
  assertCleaned("Hello\u200B, world.", "Hello, world.");
  assertCleaned("support\u200B@example.com", "support@example.com");
  assertCleaned("help\u200B@example.org", "help@example.org");
  assertCleaned("https://example\u200B.com/path", "https://example.com/path");
  assertCleaned("example\u200B.com", "example.com");
  assertCleaned("www\u200B.example.org", "www.example.org");
}

function testHomepageHiddenCharacterSmokeCase() {
  const context = loadControllerContext();
  const input = [
    "This is a really great opportunity to leverage our ability to move forward.",
    "",
    "This text\u200Bhas a hidden character.",
    "",
    "Here is a PDF-style line",
    "break that should be easier",
    "to review after cleanup."
  ].join("\n");

  const result = context.getCleanResult(input, "standard", "paragraph").text;

  assert.ok(result.includes("This text has a hidden character."));
  assert.ok(!result.includes("texthas"));
  assert.ok(
    result.includes(
      "Here is a PDF-style line break that should be easier to review after cleanup."
    )
  );
}

function testHomepageEmptyInputStatus() {
  const context = loadControllerContext();

  function makeElements(value) {
    return {
      input: createElementStub(value),
      output: createElementStub(""),
      cleanMode: createElementStub("standard"),
      viewMode: createElementStub("paragraph"),
      toolStatus: createElementStub(),
      postCleanActions: createElementStub()
    };
  }

  ["", "   \n\t  "].forEach((value) => {
    const elements = makeElements(value);
    elements.postCleanActions.hidden = false;

    context.handleClean(elements);

    assert.strictEqual(elements.toolStatus.textContent, "Paste some text first.");
    assert.strictEqual(elements.toolStatus.hidden, false);
    assert.strictEqual(elements.output.value, "");
    assert.strictEqual(elements.postCleanActions.hidden, true);
  });

  const realInputElements = makeElements("This text has extra    spacing.");
  context.handleClean(realInputElements);

  assert.strictEqual(
    realInputElements.toolStatus.textContent,
    "Cleaned text ready. Review the changes, then copy or rewrite in SecondDraft."
  );
  assert.strictEqual(realInputElements.toolStatus.hidden, false);
  assert.strictEqual(realInputElements.postCleanActions.hidden, false);
  assert.ok(realInputElements.output.value);
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

function getSecondDraftRegressionInput() {
  return [
    "I just wanted to reach out and say that we should probably take a look at the draft before sending it over. I think there are a few areas where the wording could be improved, and it may be helpful to make it a little clearer and more concise.",
    "",
    "Also, I wanted to mention that the current version feels a bit long and maybe slightly repetitive in certain places. The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural.",
    "",
    "Let me know if you think this is something we should handle today or if it can wait until tomorrow."
  ].join("\n");
}

function countTestParagraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;
}

function assertNoTrailingWhitespace(text) {
  String(text)
    .split("\n")
    .forEach((line) => {
      assert.strictEqual(line, line.trimEnd());
    });
}

function testSecondDraftRuleRegistry() {
  const context = loadSecondDraftRuleRegistryContext();
  const registry = context.window.PasteLintSecondDraftRuleRegistry;
  const data = readSecondDraftRuleRegistryData();

  assert.strictEqual(registry.validateRegistry(data).valid, true);

  const duplicateId = JSON.parse(JSON.stringify(data));
  duplicateId.rules[1].id = duplicateId.rules[0].id;
  assert.strictEqual(registry.validateRegistry(duplicateId).valid, false);
  assert.ok(
    registry.validateRegistry(duplicateId).errors.some((error) =>
      error.includes("duplicate-id")
    )
  );

  const duplicateSlug = JSON.parse(JSON.stringify(data));
  duplicateSlug.rules[1].slug = duplicateSlug.rules[0].slug;
  assert.strictEqual(registry.validateRegistry(duplicateSlug).valid, false);
  assert.ok(
    registry.validateRegistry(duplicateSlug).errors.some((error) =>
      error.includes("duplicate-slug")
    )
  );

  const invalidEnum = JSON.parse(JSON.stringify(data));
  invalidEnum.rules[0].status = "experimental";
  assert.strictEqual(registry.validateRegistry(invalidEnum).valid, false);

  const missingRequired = JSON.parse(JSON.stringify(data));
  delete missingRequired.rules[0].rationale;
  assert.strictEqual(registry.validateRegistry(missingRequired).valid, false);

  const duplicatePurpose = JSON.parse(JSON.stringify(data));
  duplicatePurpose.rules.push({
    ...duplicatePurpose.rules[0],
    id: "SD-CLARITY-999",
    slug: "duplicate-purpose-test"
  });
  assert.strictEqual(registry.validateRegistry(duplicatePurpose).valid, false);
  assert.ok(
    registry.validateRegistry(duplicatePurpose).errors.some((error) =>
      error.includes("duplicate-active-semantic-purpose")
    )
  );

  const inactiveFiltering = JSON.parse(JSON.stringify(data));
  inactiveFiltering.rules.push(
    {
      ...inactiveFiltering.rules[0],
      id: "SD-CLARITY-998",
      slug: "inactive-test",
      status: "inactive"
    },
    {
      ...inactiveFiltering.rules[0],
      id: "SD-CLARITY-997",
      slug: "deprecated-test",
      status: "deprecated",
      automation: "deprecated"
    }
  );

  registry.useRegistry(inactiveFiltering, "test");

  const activeIds = registry.getActiveRules().map((rule) => rule.id);
  assert.ok(activeIds.includes("SD-CLARITY-001"));
  assert.ok(!activeIds.includes("SD-RHYTHM-001"));
  assert.ok(!activeIds.includes("SD-CLARITY-998"));
  assert.ok(!activeIds.includes("SD-CLARITY-997"));
  assert.strictEqual(registry.getRule("SD-RHYTHM-001"), null);

  const preservationRule = registry.getRule("SD-PRESERVE-001");
  assert.strictEqual(preservationRule.type, "preservation-rule");
  assert.strictEqual(preservationRule.automation, "explanation-only");

  registry.useFallback("missing-registry");
  assert.strictEqual(registry.getActiveRules().length, 0);
  assert.strictEqual(registry.getStatus().state, "unavailable");
  assert.strictEqual(registry.getStatus().errorCode, "missing-registry");
}

function testSecondDraftRuleMetadataPreservesOutput() {
  const context = loadSecondDraftContext();
  const input = getSecondDraftRegressionInput();

  const directShorter = context.reviseSecondDraft(input, {
    tone: "direct",
    length: "shorter",
    reflow: false
  });

  assert.strictEqual(
    directShorter.text,
    "Review the draft before sending it over. The wording could be clearer and more concise. The current version feels long and repetitive in places. Review the message, tighten the language, and make sure it sounds professional but still natural. Tell me whether we should handle this today or tomorrow."
  );
  assert.deepStrictEqual(Array.from(directShorter.changes), [
    "Rewrote a filler opening into a clearer sentence",
    "Condensed weak phrasing into a clearer sentence",
    "Removed setup wording and tightened the observation",
    "Turned the main point into a direct action",
    "Tightened the timing question",
    "Tightened wording to make the draft shorter"
  ]);

  const ruleIds = directShorter.ruleMatches.map((match) => match.ruleId);
  assert.ok(ruleIds.includes("SD-CLARITY-001"));
  assert.ok(ruleIds.includes("SD-COMPRESSION-001"));
  assert.ok(ruleIds.includes("SD-REPETITION-001"));
  assert.ok(ruleIds.includes("SD-CLARITY-002"));
  assert.ok(directShorter.edits.some((edit) => edit.ruleId === "SD-CLARITY-001"));
  assert.ok(directShorter.edits.some((edit) => edit.ruleId === "SD-COMPRESSION-001"));

  const naturalSame = context.reviseSecondDraft(input, {
    tone: "natural",
    length: "same",
    reflow: false
  });

  assert.strictEqual(
    naturalSame.text,
    [
      "We should probably take a look at the draft before sending it over. I think there are a few areas where the wording could be improved. It may be helpful to make it a little clearer and more concise.",
      "",
      "Also, the current version feels a bit long and maybe slightly repetitive in certain places. The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural.",
      "",
      "Let me know if you think this is something we should handle today or if it can wait until tomorrow."
    ].join("\n")
  );
  assert.deepStrictEqual(Array.from(naturalSame.changes), [
    "Rewrote a filler opening into a clearer sentence",
    "Removed an unnecessary setup phrase"
  ]);

  const professionalExpand = context.reviseSecondDraft(input, {
    tone: "professional",
    length: "expand",
    reflow: false
  });

  assert.strictEqual(
    professionalExpand.text,
    "We should probably take a look at the draft before sending it over. This helps frame the main point more clearly. I think there are a few areas where the wording could be improved. It may be helpful to make it a little clearer and more concise. Also, the current version feels a bit long and maybe slightly repetitive in certain places. The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural. Let me know if you think this is something we should handle today or if it can wait until tomorrow."
  );
  assert.deepStrictEqual(Array.from(professionalExpand.changes), [
    "Rewrote a filler opening into a clearer sentence",
    "Removed an unnecessary setup phrase",
    "Expanded the draft slightly for smoother context and flow"
  ]);

  const friendlyReflow = context.reviseSecondDraft(input, {
    tone: "friendly",
    length: "same",
    reflow: true
  });

  assert.strictEqual(
    friendlyReflow.text,
    [
      "We should probably take a look at the draft before sending it over. I think there are a few areas where the wording could be improved. It may be helpful to make it a little clearer and more concise.",
      "",
      "Also, the current version feels a bit long and maybe slightly repetitive in certain places. The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural.",
      "",
      "Let me know if you think this is something we should handle today or if it can wait until tomorrow."
    ].join("\n")
  );
  assert.deepStrictEqual(Array.from(friendlyReflow.changes), [
    "Rewrote a filler opening into a clearer sentence",
    "Removed an unnecessary setup phrase"
  ]);
  assert.ok(
    !friendlyReflow.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );

  const brief = context.buildAnalysisBrief(
    ["A source paragraph.", "", "Another source paragraph."].join("\n")
  );

  assert.strictEqual(
    brief,
    `# Analysis Brief

## Source Material

A source paragraph.

Another source paragraph.

## Analysis Goal

Analyze this material for useful patterns, insights, risks, and next steps.

## Focus Areas

- Main themes
- Repeated phrases or ideas
- Important claims
- Gaps or unclear sections
- Possible opportunities
- Recommended next actions

## Output Format

- Short summary
- Key insights
- Notable quotes
- Risks or concerns
- Actionable next steps

## Instructions

Use the source material as the evidence base. Separate direct observations from interpretation.`
  );
}

function testSecondDraftParagraphReflowTruthfulness() {
  const context = loadSecondDraftContext();
  const reflowClaim = "Reflowed text into cleaner paragraphs";

  const fixtureA = [
    "I just wanted to reach out and say that we are currently in the process of reviewing the updated phone menu for the library.",
    "",
    "Several event descriptions changed after the original script was approved. The library team must confirm the dates, phone numbers, department names, and menu options before recording.",
    "",
    "Please review the attached script and send approval by Tuesday, July 28."
  ].join("\n");

  const fixtureAResult = context.reviseSecondDraft(fixtureA, {
    tone: "natural",
    length: "same",
    reflow: true
  });

  assert.ok(fixtureAResult.text.includes("\n\n"));
  assert.strictEqual(countTestParagraphs(fixtureAResult.text), 3);
  assert.ok(fixtureAResult.text.includes("Tuesday, July 28"));
  assert.ok(!fixtureAResult.changes.includes(reflowClaim));
  assert.ok(
    !fixtureAResult.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );
  assertNoTrailingWhitespace(fixtureAResult.text);

  const singleParagraph = "The revised menu is ready for review. Several event descriptions changed after the first approval. The library team should confirm the dates and menu options. Recording begins after approval. Late changes may delay the launch.";
  const singleResult = context.reviseSecondDraft(singleParagraph, {
    tone: "natural",
    length: "same",
    reflow: true
  });

  assert.strictEqual(countTestParagraphs(singleResult.text), 1);
  assert.ok(!singleResult.text.includes("\n\n"));
  assert.ok(!singleResult.changes.includes(reflowClaim));
  assert.ok(
    !singleResult.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );
  assert.ok(singleResult.changes.includes("No major revision needed. The text already reads cleanly."));

  const concise = "Please review the revised menu and approve it by Tuesday. Recording begins after approval.";
  const conciseResult = context.reviseSecondDraft(concise, {
    tone: "direct",
    length: "shorter",
    reflow: true
  });

  assert.strictEqual(conciseResult.text, concise);
  assert.ok(!conciseResult.changes.includes(reflowClaim));
  assert.ok(
    !conciseResult.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );
  assert.ok(conciseResult.changes.includes("No major revision needed. The text already reads cleanly."));

  const blankLineVariation = ["First paragraph.", "", "", "Second paragraph.", "", "", "", "Third paragraph."].join("\n");
  const blankLineResult = context.reviseSecondDraft(blankLineVariation, {
    tone: "natural",
    length: "same",
    reflow: true
  });

  assert.strictEqual(blankLineResult.text, "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.");
  assert.strictEqual(countTestParagraphs(blankLineResult.text), 3);
  assert.ok(!blankLineResult.changes.includes(reflowClaim));
  assert.ok(!/\n{3,}/.test(blankLineResult.text));
  assertNoTrailingWhitespace(blankLineResult.text);

  const lineBreakSource = "First paragraph.\nSecond paragraph.";
  const lineBreakResult = context.reviseSecondDraft(lineBreakSource, {
    tone: "natural",
    length: "same",
    reflow: true
  });

  assert.strictEqual(lineBreakResult.text, "First paragraph.\n\nSecond paragraph.");
  assert.ok(lineBreakResult.changes.includes(reflowClaim));
  assert.ok(
    lineBreakResult.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );
  assert.ok(!lineBreakResult.changes.includes("No major revision needed. The text already reads cleanly."));
  assertNoTrailingWhitespace(lineBreakResult.text);
}

function testSecondDraftPrimaryReflowPreservesProtectedValues() {
  const context = loadSecondDraftContext();
  const input = [
    "I just wanted to reach out and say that we are currently in the process of reviewing the updated phone menu for the library. Due to the fact that several event descriptions were changed after the original script was approved, we need to go through the entire document again in order to make sure that the recorded version is accurate.",
    "",
    "At this point in time, the main point is that we really need the library team to review the revised script and confirm that the dates, phone numbers, department names, and menu options are correct before we create the final audio files, because making changes after recording takes additional time and can cause the launch schedule to be delayed.",
    "",
    "We also wanted to mention that the introduction is a little bit longer than it needs to be, and there are also several places where the same information is repeated more than once. This is really important because callers should be able to understand the available options quickly and easily.",
    "",
    "Please review the attached script and send approval by Tuesday, July 28. Questions can be sent to support@example.com or discussed by calling 914-555-0184. The approved information page is https://example.com/library-menu.",
    "",
    "To summarize, we just need you to review everything, make sure everything is correct, and let us know whether or not we can move forward with recording."
  ].join("\n");

  const result = context.reviseSecondDraft(input, {
    tone: "natural",
    length: "same",
    reflow: true
  });

  assert.strictEqual(countTestParagraphs(result.text), 5);
  assert.ok(result.text.includes("Tuesday, July 28"));
  assert.ok(result.text.includes("support@example.com"));
  assert.ok(result.text.includes("914-555-0184"));
  assert.ok(result.text.includes("https://example.com/library-menu"));
  assert.ok(result.text.includes("library team to review the revised script"));
  assert.ok(result.text.includes("before we create the final audio files"));
  assert.ok(result.text.includes("can cause the launch schedule to be delayed"));
  assert.ok(!result.changes.includes("Reflowed text into cleaner paragraphs"));
  assert.ok(
    !result.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );
  assertNoTrailingWhitespace(result.text);
  assert.ok(!/\n{3,}/.test(result.text));
}

function testSecondDraftPrepareForSsmlTransfer() {
  const storage = {};
  const context = loadSecondDraftContext({ storage });
  const fixture = [
    "The revised library phone menu is ready for final review.",
    "",
    "Please confirm the event dates, department names, phone numbers, and menu options. Send approval to support@example.com by Tuesday, July 28.",
    "",
    "Recording begins only after approval. Questions may be discussed by calling 914-555-0184.",
    "",
    "Late changes may delay the launch. The approved information page is https://example.com/library-menu."
  ].join("\n");

  const elements = {
    input: createElementStub("Original input should not be transferred."),
    output: createElementStub(fixture),
    toolStatus: createElementStub()
  };

  context.handlePrepareSecondDraftForSsml(elements);

  assert.strictEqual(storage["pastelint-transfer-text"], fixture);
  assert.ok(storage["pastelint-transfer-text"].includes("\n\n"));
  assert.ok(storage["pastelint-transfer-text"].includes("support@example.com"));
  assert.ok(storage["pastelint-transfer-text"].includes("Tuesday, July 28"));
  assert.ok(storage["pastelint-transfer-text"].includes("914-555-0184"));
  assert.ok(storage["pastelint-transfer-text"].includes("https://example.com/library-menu"));
  assert.ok(storage["pastelint-transfer-text"].includes("Recording begins only after approval"));
  assert.ok(storage["pastelint-transfer-text"].includes("Late changes may delay the launch"));
  assert.ok(!storage["pastelint-transfer-text"].includes("Original input should not be transferred."));

  const fallbackStorage = {};
  const fallbackContext = loadSecondDraftContext({ storage: fallbackStorage });
  fallbackContext.handlePrepareSecondDraftForSsml({
    input: createElementStub(fixture),
    output: createElementStub(""),
    toolStatus: createElementStub()
  });

  assert.strictEqual(fallbackStorage["pastelint-transfer-text"], fixture);

  const unavailableStorageContext = loadSecondDraftContext();
  const unavailableElements = {
    input: createElementStub(fixture),
    output: createElementStub(fixture),
    toolStatus: createElementStub()
  };
  unavailableStorageContext.localStorage.setItem = function () {
    throw new Error("storage unavailable");
  };

  assert.doesNotThrow(() => {
    unavailableStorageContext.handlePrepareSecondDraftForSsml(unavailableElements);
  });
  assert.strictEqual(unavailableElements.input.value, fixture);
  assert.strictEqual(unavailableElements.output.value, fixture);
}

function testSsmlBuilderLoadsTransferText() {
  const fixture = [
    "The revised library phone menu is ready for final review.",
    "",
    "Please confirm the event dates, department names, phone numbers, and menu options. Send approval to support@example.com by Tuesday, July 28.",
    "",
    "Recording begins only after approval. Questions may be discussed by calling 914-555-0184.",
    "",
    "Late changes may delay the launch. The approved information page is https://example.com/library-menu."
  ].join("\n");
  const storage = {
    "pastelint-transfer-text": fixture
  };
  const input = createElementStub("");
  const cleanOutput = createElementStub("");
  const ssmlOutput = createElementStub("");
  const documentEvents = {};
  const context = loadSsmlContext(
    {
      input,
      cleanOutput,
      ssmlOutput
    },
    { storage, documentEvents }
  );

  assert.strictEqual(documentEvents.DOMContentLoaded.length, 1);
  documentEvents.DOMContentLoaded[0]();

  assert.strictEqual(input.value, fixture);
  assert.strictEqual(cleanOutput.value, "");
  assert.strictEqual(ssmlOutput.value, "");
  assert.strictEqual(storage["pastelint-transfer-text"], undefined);
  assert.ok(input.value.includes("\n\n"));
  assert.ok(input.value.includes("support@example.com"));
  assert.ok(input.value.includes("Tuesday, July 28"));
  assert.ok(input.value.includes("914-555-0184"));
  assert.ok(input.value.includes("https://example.com/library-menu"));
  assert.ok(input.value.includes("Recording begins only after approval"));
  assert.ok(input.value.includes("Late changes may delay the launch"));

  const waitingStorage = {
    "pastelint-transfer-text": "Transferred text should wait."
  };
  const waitingInput = createElementStub("Existing SSML input.");
  const waitingDocumentEvents = {};
  loadSsmlContext(
    {
      input: waitingInput,
      cleanOutput: createElementStub(""),
      ssmlOutput: createElementStub("")
    },
    {
      storage: waitingStorage,
      documentEvents: waitingDocumentEvents
    }
  );

  assert.strictEqual(waitingDocumentEvents.DOMContentLoaded.length, 1);
  waitingDocumentEvents.DOMContentLoaded[0]();

  assert.strictEqual(waitingInput.value, "Existing SSML input.");
  assert.strictEqual(waitingStorage["pastelint-transfer-text"], "Transferred text should wait.");
}

function testSsmlCleanup() {
  const context = loadSsmlContext();

  assert.ok(
    context.cleanText("otbs@rhpl.org").includes("O T B S at R H P L dot org")
  );
  assert.ok(
    context.cleanText("OTBS@RHPL.org").includes("O T B S at R H P L dot org.")
  );
  assert.ok(
    context.cleanText("help@example.org").includes("help at example dot org.")
  );
  assert.ok(context.cleanText("rhpl.org").includes("R H P L dot org"));
  assert.ok(
    context.cleanText("support@library.org").includes("support at library dot org")
  );
  assert.ok(
    context.cleanText("otbs.rhpl.org").includes("O T B S dot R H P L dot org.")
  );
  assert.ok(
    context.cleanText("www.example.org").includes("W W W dot example dot org.")
  );
  assert.strictEqual(context.cleanText("@danthemancina"), "at danthemancina.");
  assert.strictEqual(
    context.cleanText("Follow us @libraryname."),
    "Follow us at libraryname."
  );
  assert.notStrictEqual(context.formatHeading("In this issue:"), "In this issue:.");
  assert.notStrictEqual(context.formatHeading("Need help?"), "Need help?.");
  assert.notStrictEqual(context.formatHeading("Important update!"), "Important update!.");
  assert.notStrictEqual(context.formatHeading("Events;"), "Events;.");
  assert.ok(!context.cleanText("Leader Dogs for the Blind\u00AE").includes("\u00AE"));
  assert.strictEqual(context.cleanText("Program\u2122 update"), "Program update.");
  assert.strictEqual(context.cleanText("Copyright \u00A9 2026"), "Copyright 2026.");
  assert.strictEqual(context.cleanText("Service mark\u2120 notice"), "Service mark notice.");
  assert.strictEqual(context.cleanText("Everything We DonÃ¢â‚¬â„¢t Know"), "Everything We Don't Know.");
  assert.strictEqual(context.cleanText("10 a.m.Ã¢â‚¬â€œ1:30 p.m."), "10 a.m. to 1:30 p.m.");
  assert.strictEqual(context.cleanText("Leader Dogs for the BlindÃ‚Â®"), "Leader Dogs for the Blind.");
  assert.strictEqual(
    context.cleanText("Third Monday of each month at 1 p.m."),
    "Third Monday of each month at 1 p.m."
  );
  assert.strictEqual(
    context.cleanText("Second Monday of each month at 1pm."),
    "Second Monday of each month at 1 p.m."
  );
  assert.strictEqual(
    context.cleanText("Wednesday, September 23 from 10 a.m.\u20131:30 p.m."),
    "Wednesday, September 23 from 10 a.m. to 1:30 p.m."
  );
  assert.strictEqual(
    context.cleanText("Wednesday, September 23 from 10 a. m. to 1: 30 p. m."),
    "Wednesday, September 23 from 10 a.m. to 1:30 p.m."
  );
  assert.strictEqual(context.cleanText("The event is at 7 PM."), "The event is at 7 p.m.");
  assert.strictEqual(
    context.cleanText("Accessible Technology (A.T.) topics"),
    "Accessible Technology (A.T.) topics."
  );
  assert.strictEqual(context.cleanText("U.S. history discussion."), "U.S. history discussion.");
  assert.ok(context.cleanText("DB134728").includes("DB 1-3-4-7-2-8"));
  assert.ok(context.cleanText("DB123456").includes("DB 1-2-3-4-5-6"));
  assert.ok(context.cleanText("DB 1-2-3-4-5-6").includes("DB 1-2-3-4-5-6"));
  assert.ok(!context.cleanText("DB 1-2-3-4-5-6").includes("DB 1---2"));
  assert.ok(
    context.cleanText("by Mark Kurlansky DB134728").includes(
      "by Mark Kurlansky, DB 1-3-4-7-2-8"
    )
  );
  assert.ok(
    context.cleanText("by Erika Hamden DB134289").includes(
      "by Erika Hamden, DB 1-3-4-2-8-9"
    )
  );
  assert.ok(
    context.cleanText("by Deanna Raybourn DB 110076").includes(
      "by Deanna Raybourn, DB 1-1-0-0-7-6"
    )
  );
  assert.ok(
    context.cleanText("by Mark Kurlansky, DB134728").includes(
      "by Mark Kurlansky, DB 1-3-4-7-2-8"
    )
  );
  assert.ok(!context.cleanText("by Mark Kurlansky, DB134728").includes("Kurlansky,, DB"));
  assert.ok(!context.cleanText("by Mark Kurlansky, DB134728").includes("Kurlansky, , DB"));
  assert.ok(
    context.cleanText("by Mark Kurlansky: DB134728").includes(
      "by Mark Kurlansky: DB 1-3-4-7-2-8"
    )
  );
  assert.ok(
    context.cleanText("by Mark Kurlansky. DB134728").includes(
      "by Mark Kurlansky. DB 1-3-4-7-2-8"
    )
  );
  assert.strictEqual(
    context.cleanText("Spellcaster DB 1-3-4-0-3-7 10 hours, 6 minutes by Jaymin Eve."),
    "Spellcaster, DB 1-3-4-0-3-7. 10 hours, 6 minutes, by Jaymin Eve."
  );
  assert.strictEqual(
    context.cleanText("Spellcaster DB134037 10 hours, 6 minutes by Jaymin Eve."),
    "Spellcaster, DB 1-3-4-0-3-7. 10 hours, 6 minutes, by Jaymin Eve."
  );
  assert.strictEqual(
    context.cleanText("Heart the Lover, DB 1-3-3-2-9-0. 5 hours, 56 minutes, by Lily King."),
    "Heart the Lover, DB 1-3-3-2-9-0. 5 hours, 56 minutes, by Lily King."
  );
  assert.strictEqual(
    context.cleanText("DB 1-3-4-0-3-7 Spellcaster."),
    "DB 1-3-4-0-3-7 Spellcaster."
  );
  assert.strictEqual(
    context.cleanText('Read by Savannah Peachwood "Welcome to the story."'),
    'Read by Savannah Peachwood. "Welcome to the story. "'
  );
  assert.strictEqual(context.cleanText("version 1.2.3"), "version 1.2.3.");
  assert.strictEqual(
    context.cleanText("file name report.final.doc"),
    "file name report.final.doc."
  );
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

function testSsmlIvrMenuCleanup() {
  const context = loadSsmlContext();
  const input = [
    "Press 1 for hours@library.org",
    "Press 2 for upcoming events",
    "Visit rhpl.org for more information"
  ].join("\n");

  assert.strictEqual(
    context.cleanText(input),
    [
      "Press 1 for hours at library dot org",
      "Press 2 for upcoming events",
      "Visit R H P L dot org. For more information."
    ].join("\n")
  );
}

function testSsmlXmlEscaping() {
  const elements = {
    input: createElementStub("Raw text that should not be used."),
    cleanOutput: createElementStub("A & B < C > D"),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub()
  };

  const context = loadSsmlContext(elements);
  context.generateSsmlFromCleanedText();

  const output = elements.ssmlOutput.value;
  const body = output.replace(/<\/?speak>|<\/?prosody[^>]*>/g, "");

  assert.ok(output.includes("A &amp; B &lt; C &gt; D"));
  assert.ok(!body.includes("A & B < C > D"));

  const rawHandleElements = {
    input: createElementStub("Follow us @danthemancina."),
    cleanOutput: createElementStub(""),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub()
  };
  const rawHandleContext = loadSsmlContext(rawHandleElements);
  rawHandleContext.generateSsmlOnly();

  assert.ok(rawHandleElements.ssmlOutput.value.includes("Follow us at danthemancina."));
  assert.ok(!rawHandleElements.ssmlOutput.value.includes("@danthemancina"));

  const rawEmailElements = {
    input: createElementStub("Email help@example.org."),
    cleanOutput: createElementStub(""),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub()
  };
  const rawEmailContext = loadSsmlContext(rawEmailElements);
  rawEmailContext.generateSsmlOnly();

  assert.ok(rawEmailElements.ssmlOutput.value.includes("Email help@example.org."));
  assert.ok(!rawEmailElements.ssmlOutput.value.includes("help at example"));
}

function testSsmlApprovedCleanedTextPreservation() {
  const approvedText = [
    "Approved wording stays exact.",
    "Approved @handle stays exact.",
    "",
    "Call us at 2-4-8, 6-5-0, 7-1-5-0.",
    "",
    "Visit O T B S dot R H P L dot org."
  ].join("\n");

  const elements = {
    input: createElementStub("DB123456 should not be cleaned from raw input."),
    cleanOutput: createElementStub(approvedText),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub()
  };

  const context = loadSsmlContext(elements);
  context.generateSsmlFromCleanedText();

  const output = elements.ssmlOutput.value;
  assert.ok(output.includes(approvedText));
  assert.ok(!output.includes("DB 1-2-3-4-5-6"));
  assert.ok(!output.includes("DB123456 should not be cleaned from raw input."));
}

function testSsmlChunkingSafety() {
  const context = loadSsmlContext();
  const shortText = [
    "First short IVR prompt.",
    "",
    "Second short IVR prompt."
  ].join("\n");
  const nearLimitText = "This IVR prompt stays inside one chunk. ".repeat(70).trim();

  const shortChunks = context.splitIntoBookAwareChunks(shortText, 3000);
  const nearLimitChunks = context.splitIntoBookAwareChunks(nearLimitText, 3000);

  assert.strictEqual(
    JSON.stringify(shortChunks),
    JSON.stringify([
      "First short IVR prompt.",
      "Second short IVR prompt."
    ])
  );
  assert.strictEqual(nearLimitChunks.length, 1);
  assert.ok(nearLimitChunks.every((chunk) => chunk.trim()));
}

function normalizeChunkText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function testSsmlCatalogRecordChunking() {
  const context = loadSsmlContext();
  const limit = 3000;
  const longDescription = "This synthetic catalog description keeps the first record near the chunk limit while remaining one complete book record for review. ".repeat(19);
  const firstRecord = [
    "How To Test Negative for Stupid and Why Washington Never Will DB 1-3-3-8-7-3. 8 hours, 17 minutes, by John Kennedy. Read by John Kennedy.",
    `"${longDescription.trim()}"`,
    "From publisher. Unrated. Commercial audiobook. Bestseller. 2025. DB 1-3-3-8-7-3. How To Test Negative for Stupid and Why Washington Never Will."
  ].join(" ");
  const secondTitle = "Jump and Find Joy: Embracing Change in Every Season of Life";
  const secondRecord = [
    `${secondTitle}, DB 1-3-4-0-7-6. 5 hours, 30 minutes, by Hoda Kotb. Read by Hoda Kotb.`,
    "\"A short synthetic description about change, seasons, and practical encouragement.\"",
    "From publisher. Unrated. Commercial audiobook. 2025. DB 1-3-4-0-7-6. Jump and Find Joy: Embracing Change in Every Season of Life."
  ].join(" ");
  const source = [
    "Adult Nonfiction",
    "Biography",
    "",
    firstRecord,
    secondRecord
  ].join("\n");

  const chunks = context.splitIntoBookAwareChunks(source, limit);
  const secondRecordChunk = chunks.find((chunk) => chunk.includes(secondTitle));
  const secondRecordChunkIndex = chunks.indexOf(secondRecordChunk);

  assert.ok(chunks.length > 1);
  assert.ok(secondRecordChunk, "Expected a chunk containing the Jump and Find Joy record.");
  assert.ok(secondRecordChunk.includes("DB 1-3-4-0-7-6"));
  assert.ok(secondRecordChunk.includes("5 hours, 30 minutes"));
  assert.ok(secondRecordChunk.includes("by Hoda Kotb"));
  assert.ok(secondRecordChunk.includes("Read by Hoda Kotb"));
  assert.ok(secondRecordChunk.includes("From publisher."));
  assert.ok(secondRecordChunk.includes("Jump and Find Joy: Embracing Change in Every Season of Life."));

  if (secondRecordChunkIndex > 0) {
    assert.ok(
      !chunks[secondRecordChunkIndex - 1].includes(secondTitle),
      "The second catalog title should not be orphaned in the previous chunk."
    );
  }

  assert.ok(chunks.every((chunk) => chunk.length <= limit));
  assert.strictEqual(normalizeChunkText(chunks.join("\n\n")), normalizeChunkText(source));
}

function testSsmlLargeOtbsScriptCleanup() {
  const input = [
    "Dial-In Discussions",
    "",
    "Each month we will gather to discuss various topics over the phone. For updated information about monthly topics, call ",
    "248-650-7150. ",
    "",
    "Third Monday of each month at 1 p.m.",
    "",
    "To join the call, dial 888-916-5522. No pin or password is needed. ",
    "",
    "August 24, 1 p.m.: Vicky Preddy from Vanda Pharmaceuticals shares information and resources about Non-24-Hour Sleep-Wake Disorder, a common disorder for people who are blind. (Note: this meeting is the fourth Monday of August)",
    "",
    "September 21, 1 p.m.: Dan Mancina, a blind skateboarder who made a skatepark designed for the visually impaired, will join us to tell his story and all about his skate park project. He shares his skate videos on his instagram account, @danthemancina.",
    "",
    "October 19, 1 p.m.: ACB Get Up and Get Moving Committee talks about their mission to engage, empower, and educate individuals to help everyone take responsibility over their own health.",
    "",
    "Where itâ€™s A.T.",
    "",
    "Each month, Chad will host a discussion on Accessible Technology (A.T.) topics over the phone. If you have questions, call Chad at ",
    "248-650-5683.",
    "",
    "Second Monday of each month at 1pm. ",
    "",
    "To join the call, dial 888-916-5522. No pin or password is needed. ",
    "",
    "August 10: Ray-Ban Meta Glasses",
    "",
    "September 14: Humanware eReader",
    "",
    "October 12: Siri and Hey Google",
    "",
    "OTBS Book Discussion Groups",
    "",
    "Are you looking for an opportunity to discuss great books and meet other Oakland Talking Book Service (OTBS) patrons? Consider joining one (or both!) of our book discussion groups. If you have questions or want to receive the books, call 248-650-5681.",
    "",
    "Monday, August 3 at 1 p.m. (In-person)",
    "",
    "FH Brunch Factory, 25938 Middlebelt Rd., Farmington Hills MI, 48336",
    "",
    "Join us for an in person meeting! Come with a book recommendation to share with the group. Food available for purchase.",
    "",
    "First Monday of each month at 1 p.m.",
    "",
    "To join the call, dial 888-916-5522. No pin or password is needed.",
    "",
    "September 7: No meeting due to the Labor Day holiday.",
    "",
    "October 5: Cheesecake: A Novel by Mark Kurlansky DB134728",
    "",
    "Third Wednesday of each month at 1 p.m.",
    "",
    "To join the call, dial (888) 916-5522. No pin or password is needed.",
    "",
    "August: No Meeting ",
    "",
    "September 16: Weird Universe: Everything We Donâ€™t Know About Space (and Why Itâ€™s Important) by Erika Hamden DB134289",
    "",
    "October 21: Killers of a Certain Age by Deanna Raybourn DB 110076",
    "",
    "Low Vision Expo at Leader Dogs For the Blind",
    "",
    "Wednesday, September 23 from 10 a.m.â€“1:30 p.m.",
    "",
    "Leader Dogs for the Blind campus, Polk Residence Building, ",
    "1039 S Rochester Rd, Rochester Hills, MI, 48307",
    "",
    "Rochester Hills Public Library and Leader Dogs for the BlindÂ® are pleased to present the third Low Vision Expo. In addition to a variety of exhibitors who will demonstrate the latest products and services for the blind and visually impaired, presentations will be offered on topics relating to services for the visually impaired and adaptive technology."
  ].join("\n");

  const elements = {
    input: createElementStub(input),
    cleanOutput: createElementStub(),
    ssmlOutput: createElementStub(),
    ssmlStatus: createElementStub()
  };
  const context = loadSsmlContext(elements);
  const cleaned = context.buildFullCleanText();
  const ssml = context.wrapSSML(cleaned);

  assert.ok(cleaned.includes("call 248-650-7150."));
  assert.ok(cleaned.includes("call Chad at 248-650-5683."));
  assert.ok(!cleaned.includes("call.\n248-650-7150."));
  assert.ok(!cleaned.includes("call Chad at.\n248-650-5683."));
  assert.ok(cleaned.includes("August 24, 1 p.m.: Vicky Preddy"));
  assert.ok(!cleaned.includes("August 24, 1 p.m. :"));
  assert.ok(cleaned.includes("(A.T.)"));
  assert.ok(!cleaned.includes("(A.T. )"));
  assert.ok(cleaned.includes("instagram account, at danthemancina."));
  assert.ok(!cleaned.includes("@danthemancina"));
  assert.ok(cleaned.includes("one (or both!)"));
  assert.ok(!cleaned.includes("one (or both! )"));
  assert.ok(cleaned.includes("Middlebelt Rd.,"));
  assert.ok(!cleaned.includes("Middlebelt Rd. ,"));
  assert.ok(
    cleaned.includes(
      "October 5: Cheesecake: A Novel by Mark Kurlansky, DB 1-3-4-7-2-8."
    )
  );
  assert.ok(
    cleaned.includes(
      "September 16: Weird Universe: Everything We Don't Know About Space (and Why It's Important) by Erika Hamden, DB 1-3-4-2-8-9."
    )
  );
  assert.ok(
    cleaned.includes(
      "October 21: Killers of a Certain Age by Deanna Raybourn, DB 1-1-0-0-7-6."
    )
  );
  assert.ok(!cleaned.includes("Kurlansky,, DB"));
  assert.ok(!cleaned.includes("Hamden,, DB"));
  assert.ok(!cleaned.includes("Raybourn,, DB"));
  assert.ok(cleaned.includes("Low Vision Expo at Leader Dogs for the Blind."));
  assert.ok(!cleaned.includes("DB 1-1-0-0-7-6 Rochester Hills Public Library"));
  assert.ok(cleaned.includes("from 10 a.m. to 1:30 p.m."));
  assert.ok(!cleaned.includes("p. m."));
  assert.ok(!cleaned.includes("a. m."));
  assert.ok(!cleaned.includes("1pm"));
  assert.ok(!cleaned.includes("1: 30"));
  assert.ok(!ssml.includes("p. m."));
  assert.ok(!ssml.includes("a. m."));
  assert.ok(!ssml.includes("1pm"));
  assert.ok(!ssml.includes("1: 30"));
  assert.ok(!cleaned.includes("10 a.m. â€“1:30 p.m."));
  assert.ok(!cleaned.includes("Â®"));
  assert.ok(!cleaned.includes("? ?"));
  assert.ok(ssml.includes("<speak>"));
  assert.ok(ssml.includes("<prosody rate=\"94%\">"));
  assert.ok(ssml.includes("</prosody>"));
  assert.ok(ssml.includes("</speak>"));
}

function testSsmlEmptyActionStatuses() {
  const elements = {
    input: createElementStub(""),
    cleanOutput: createElementStub(""),
    ssmlOutput: createElementStub(""),
    ssmlStatus: createElementStub(),
    footerType: createElementStub("none"),
    chunksContainer: createElementStub(),
    chunkSummary: createElementStub()
  };

  const context = loadSsmlContext(elements);

  context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Paste some text first.");
  assert.strictEqual(elements.cleanOutput.value, "");

  elements.input.value = "   \n\t   ";
  elements.cleanOutput.value = "Previous cleaned text.";
  context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Paste some text first.");
  assert.strictEqual(elements.cleanOutput.value, "");

  elements.input.value = "Welcome to the library.";
  const cleaned = context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Cleaned text ready. Review it before generating SSML.");
  assert.ok(cleaned.includes("Welcome to the library."));
  assert.ok(elements.cleanOutput.value.includes("Welcome to the library."));

  elements.input.value = "";
  elements.cleanOutput.value = "";
  elements.footerType.value = "calendar";
  const footerCleaned = context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Cleaned text ready. Review it before generating SSML.");
  assert.ok(footerCleaned.includes("To go back to the previous section, press 4."));
  assert.ok(elements.cleanOutput.value.includes("To go back to the previous section, press 4."));

  elements.footerType.value = "none";
  elements.cleanOutput.value = "";
  elements.ssmlOutput.value = "";

  context.generateSsmlOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Nothing to generate yet.");

  context.speakTextById("cleanOutput");
  assert.strictEqual(elements.ssmlStatus.textContent, "Nothing to read yet.");

  context.exportChunksZip();
  assert.strictEqual(elements.ssmlStatus.textContent, "Nothing to export yet.");
}

function main() {
  runTest("Hidden characters", testCleanEngineHiddenCharacters);
  runTest("Homepage hidden-character smoke case", testHomepageHiddenCharacterSmokeCase);
  runTest("Homepage empty input status", testHomepageEmptyInputStatus);
  runTest("Hidden-character page structure", testScriptHiddenPageStructure);
  runTest("PDF paste reflow", testScriptPdfPostProcessing);
  runTest("SecondDraft rewrites", testSecondDraftRewrites);
  runTest("SecondDraft rule registry", testSecondDraftRuleRegistry);
  runTest("SecondDraft rule metadata preserves output", testSecondDraftRuleMetadataPreservesOutput);
  runTest("SecondDraft paragraph reflow truthfulness", testSecondDraftParagraphReflowTruthfulness);
  runTest("SecondDraft primary reflow preserves protected values", testSecondDraftPrimaryReflowPreservesProtectedValues);
  runTest("SecondDraft Prepare for SSML transfer", testSecondDraftPrepareForSsmlTransfer);
  runTest("SSML Builder loads transfer text", testSsmlBuilderLoadsTransferText);
  runTest("SSML cleanup", testSsmlCleanup);
  runTest("SSML IVR menu cleanup", testSsmlIvrMenuCleanup);
  runTest("SSML XML escaping", testSsmlXmlEscaping);
  runTest("SSML generate from cleaned text", testSsmlGenerateFromCleanedText);
  runTest("SSML approved cleaned text preservation", testSsmlApprovedCleanedTextPreservation);
  runTest("SSML chunking safety", testSsmlChunkingSafety);
  runTest("SSML catalog record chunking", testSsmlCatalogRecordChunking);
  runTest("SSML large OTBS script cleanup", testSsmlLargeOtbsScriptCleanup);
  runTest("SSML empty action statuses", testSsmlEmptyActionStatuses);

  console.log("All regression checks passed.");
}

main();
