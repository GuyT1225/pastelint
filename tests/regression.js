"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const os = require("os");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function loadScript(relativePath, context) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

function createElementStub(value = "") {
  return {
    value,
    dataset: {},
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
  loadScript("js/feedback-state.js", context);
  loadScript("js/script.js", context);
  return context;
}

function loadSecondDraftContext(options = {}) {
  const context = createContext(options);
  loadScript("js/feedback-state.js", context);
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

  loadScript("js/feedback-state.js", context);
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

    assert.strictEqual(elements.toolStatus.textContent, "Add text to clean.");
    assert.strictEqual(elements.toolStatus.dataset.feedbackState, "blocked");
    assert.strictEqual(elements.toolStatus.hidden, false);
    assert.strictEqual(elements.output.value, "");
    assert.strictEqual(elements.postCleanActions.hidden, true);
  });

  const realInputElements = makeElements("This text has extra    spacing.");
  context.handleClean(realInputElements);

  assert.strictEqual(
    realInputElements.toolStatus.textContent,
    "Text cleaned. Review the repairs, then continue when ready."
  );
  assert.strictEqual(realInputElements.toolStatus.dataset.feedbackState, "changed");
  assert.strictEqual(realInputElements.toolStatus.hidden, false);
  assert.strictEqual(realInputElements.postCleanActions.hidden, false);
  assert.ok(realInputElements.output.value);

  const unchangedElements = makeElements("This text is already clean.");
  context.handleClean(unchangedElements);
  assert.strictEqual(unchangedElements.toolStatus.dataset.feedbackState, "unchanged");
  assert.strictEqual(
    unchangedElements.toolStatus.textContent,
    "No cleanup needed. The text was preserved."
  );
  assert.strictEqual(unchangedElements.output.value, unchangedElements.input.value);
}

function testFeedbackStateFoundation() {
  const context = createContext();
  loadScript("js/feedback-state.js", context);
  const status = createElementStub();

  ["changed", "unchanged", "blocked", "failed"].forEach((state) => {
    context.window.PasteLintFeedback.set(status, state, state);
    assert.strictEqual(status.dataset.feedbackState, state);
    assert.strictEqual(status.textContent, state);
    assert.strictEqual(status.hidden, false);
  });

  assert.throws(
    () => context.window.PasteLintFeedback.set(status, "success", "Done"),
    /Unknown feedback state/
  );
}

function testSecondDraftFeedbackStates() {
  const context = loadSecondDraftContext();

  function makeElements(value) {
    return {
      input: createElementStub(value),
      output: createElementStub(""),
      outputPanel: createElementStub(),
      toneSelect: createElementStub("natural"),
      lengthSelect: createElementStub("same"),
      reflowToggle: { ...createElementStub(), checked: false },
      toolStatus: createElementStub(),
      changeInsightEmpty: createElementStub(),
      changeInsightList: createElementStub(),
      editMapEmpty: createElementStub(),
      editMapList: createElementStub(),
      inputCharCount: createElementStub(),
      inputWordCount: createElementStub(),
      outputCharCount: createElementStub(),
      outputWordCount: createElementStub()
    };
  }

  const blocked = makeElements("");
  context.handleSecondDraftRevise(blocked);
  assert.strictEqual(blocked.toolStatus.dataset.feedbackState, "blocked");
  assert.strictEqual(blocked.toolStatus.textContent, "Add text to revise.");

  const unchanged = makeElements("The revised menu is ready for review.");
  context.handleSecondDraftRevise(unchanged);
  assert.strictEqual(unchanged.toolStatus.dataset.feedbackState, "unchanged");
  assert.strictEqual(unchanged.output.value, unchanged.input.value);

  const changed = makeElements("I wanted to mention that the schedule changed.");
  context.handleSecondDraftRevise(changed);
  assert.strictEqual(changed.toolStatus.dataset.feedbackState, "changed");
  assert.notStrictEqual(changed.output.value, changed.input.value);

  assert.strictEqual(
    context.isTrustworthySecondDraftResult({ text: ", to finish." }),
    false
  );
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

function testSecondDraftDirectRequestDifferentiation() {
  const context = loadSecondDraftContext();
  const naturalOptions = {
    tone: "natural",
    length: "same",
    reflow: false
  };
  const directOptions = {
    tone: "direct",
    length: "same",
    reflow: false
  };
  const directChange =
    "Rewrote hesitant request framing into a clear, professional action";
  const directRuleId = "SD-CLARITY-002";

  const primary =
    "I was hoping you might be able to review the revised menu when you have a chance. The main thing we need is approval before recording can begin.";
  const primaryNatural = context.reviseSecondDraft(primary, naturalOptions);
  const primaryDirect = context.reviseSecondDraft(primary, directOptions);

  assert.strictEqual(primaryNatural.text, primary);
  assert.strictEqual(
    primaryDirect.text,
    "Please review the revised menu when you have a chance. The main thing we need is approval before recording can begin."
  );
  assert.notStrictEqual(primaryDirect.text, primaryNatural.text);
  assert.ok(primaryDirect.text.includes("review the revised menu"));
  assert.ok(primaryDirect.text.includes("approval before recording can begin"));
  assert.ok(!primaryDirect.text.includes("by Tuesday"));

  const simple =
    "I was wondering if you could review the revised menu.";
  const simpleNatural = context.reviseSecondDraft(simple, naturalOptions);
  const simpleDirect = context.reviseSecondDraft(simple, directOptions);

  assert.strictEqual(simpleNatural.text, simple);
  assert.strictEqual(simpleDirect.text, "Please review the revised menu.");
  assert.notStrictEqual(simpleDirect.text, simpleNatural.text);
  assert.deepStrictEqual(Array.from(simpleDirect.changes), [directChange]);
  assert.strictEqual(simpleDirect.ruleMatches.length, 1);
  assert.strictEqual(simpleDirect.ruleMatches[0].ruleId, directRuleId);
  assert.strictEqual(simpleDirect.ruleMatches[0].change, directChange);
  assert.strictEqual(simpleDirect.edits.length, 1);
  assert.strictEqual(simpleDirect.edits[0].before, simple);
  assert.strictEqual(
    simpleDirect.edits[0].after,
    "Please review the revised menu."
  );
  assert.strictEqual(simpleDirect.edits[0].ruleId, directRuleId);
  assert.ok(simpleDirect.edits.every((edit) => simpleDirect.text.includes(edit.after)));
  assert.ok(!simpleNatural.ruleMatches.some((match) => match.ruleId === directRuleId));

  [
    "I was hoping you could review the revised menu.",
    "We were hoping you could review the revised menu.",
    "I was hoping you might be able to review the revised menu.",
    "We were hoping you might be able to review the revised menu."
  ].forEach((input) => {
    const natural = context.reviseSecondDraft(input, naturalOptions);
    const direct = context.reviseSecondDraft(input, directOptions);

    assert.strictEqual(natural.text, input);
    assert.strictEqual(direct.text, "Please review the revised menu.");
    assert.ok(direct.changes.includes(directChange));
    assert.ok(
      direct.ruleMatches.some((match) => match.ruleId === directRuleId)
    );
    assert.ok(
      direct.edits.some(
        (edit) =>
          edit.before === input &&
          edit.after === "Please review the revised menu."
      )
    );
  });

  const pluralRequest =
    "We were hoping you could review the event dates and confirm the phone numbers.";
  const pluralNatural = context.reviseSecondDraft(
    pluralRequest,
    naturalOptions
  );
  const pluralDirect = context.reviseSecondDraft(
    pluralRequest,
    directOptions
  );

  assert.strictEqual(pluralNatural.text, pluralRequest);
  assert.strictEqual(
    pluralDirect.text,
    "Please review the event dates and confirm the phone numbers."
  );
  assert.ok(pluralDirect.text.includes("review the event dates"));
  assert.ok(pluralDirect.text.includes("confirm the phone numbers"));
  assert.ok(!pluralDirect.text.includes("Please were review"));
  assert.ok(!pluralDirect.text.includes("Please hoping"));
  assert.ok(!pluralDirect.text.includes("Please you could"));

  const multipleActions =
    "When you have a chance, could you review the event dates and confirm the phone numbers?";
  const multipleActionsDirect = context.reviseSecondDraft(
    multipleActions,
    directOptions
  );
  assert.strictEqual(
    multipleActionsDirect.text,
    "Please review the event dates and confirm the phone numbers?"
  );
  assert.ok(multipleActionsDirect.text.includes("review the event dates"));
  assert.ok(multipleActionsDirect.text.includes("confirm the phone numbers"));

  const protectedValues =
    "I was hoping you could approve the revised menu by Tuesday, July 28. Send questions to support@example.com or call 914-555-0184.";
  const protectedValuesDirect = context.reviseSecondDraft(
    protectedValues,
    directOptions
  );
  assert.strictEqual(
    protectedValuesDirect.text,
    "Please approve the revised menu by Tuesday, July 28. Send questions to support@example.com or call 914-555-0184."
  );
  assert.ok(protectedValuesDirect.text.includes("Tuesday, July 28"));
  assert.ok(protectedValuesDirect.text.includes("support@example.com"));
  assert.ok(protectedValuesDirect.text.includes("914-555-0184"));
  assert.ok(protectedValuesDirect.text.includes("approve the revised menu by"));

  const url =
    "Would you be able to review the approved page at https://example.com/library-menu?";
  const urlDirect = context.reviseSecondDraft(url, directOptions);
  assert.strictEqual(
    urlDirect.text,
    "Please review the approved page at https://example.com/library-menu?"
  );
  assert.ok(urlDirect.text.includes("https://example.com/library-menu"));
  assert.ok(!urlDirect.text.includes("approve the approved page"));

  const negation =
    "I was wondering if you could confirm that recording will not begin before approval.";
  const negationDirect = context.reviseSecondDraft(negation, directOptions);
  assert.strictEqual(
    negationDirect.text,
    "Please confirm that recording will not begin before approval."
  );
  assert.ok(negationDirect.text.includes("not"));
  assert.ok(negationDirect.text.includes("before approval"));

  const condition =
    "If the dates are correct, could you approve the revised menu?";
  const conditionDirect = context.reviseSecondDraft(condition, directOptions);
  assert.strictEqual(conditionDirect.text, condition);
  assert.ok(conditionDirect.text.startsWith("If the dates are correct"));
  assert.ok(!conditionDirect.changes.includes(directChange));
  assert.ok(
    !conditionDirect.ruleMatches.some((match) => match.ruleId === directRuleId)
  );

  const alreadyDirect =
    "Please review the revised menu and approve it by Tuesday. Recording begins after approval.";
  const alreadyDirectNatural = context.reviseSecondDraft(
    alreadyDirect,
    naturalOptions
  );
  const alreadyDirectResult = context.reviseSecondDraft(
    alreadyDirect,
    directOptions
  );
  assert.strictEqual(alreadyDirectNatural.text, alreadyDirect);
  assert.strictEqual(alreadyDirectResult.text, alreadyDirect);
  assert.deepStrictEqual(Array.from(alreadyDirectResult.edits), []);
  assert.ok(!alreadyDirectResult.changes.includes(directChange));
  assert.ok(
    !alreadyDirectResult.ruleMatches.some((match) => match.ruleId === directRuleId)
  );

  const politeDirect = "Could you please confirm the event dates?";
  const politeDirectResult = context.reviseSecondDraft(
    politeDirect,
    directOptions
  );
  assert.strictEqual(politeDirectResult.text, politeDirect);
  assert.deepStrictEqual(Array.from(politeDirectResult.edits), []);
  assert.ok(!politeDirectResult.changes.includes(directChange));

  const nonRequest = "I hope the library event goes well.";
  const nonRequestDirect = context.reviseSecondDraft(nonRequest, directOptions);
  assert.strictEqual(nonRequestDirect.text, nonRequest);
  assert.ok(!nonRequestDirect.changes.includes(directChange));

  const supervisor =
    "Please let your supervisor know that the menu was approved.";
  const supervisorDirect = context.reviseSecondDraft(supervisor, directOptions);
  assert.strictEqual(supervisorDirect.text, supervisor);
  assert.ok(!supervisorDirect.changes.includes(directChange));

  const quoted =
    "The script says, \u201cI was hoping you might be able to review the revised menu.\u201d";
  const quotedDirect = context.reviseSecondDraft(quoted, directOptions);
  assert.strictEqual(quotedDirect.text, quoted);
  assert.ok(!quotedDirect.changes.includes(directChange));

  const paragraphs = [
    "I was wondering if you could review the revised menu.",
    "",
    "Recording begins only after approval."
  ].join("\n");
  const paragraphsDirect = context.reviseSecondDraft(
    paragraphs,
    directOptions
  );
  assert.strictEqual(
    paragraphsDirect.text,
    [
      "Please review the revised menu.",
      "",
      "Recording begins only after approval."
    ].join("\n")
  );
  assert.ok(paragraphsDirect.text.includes("\n\n"));
  assert.ok(paragraphsDirect.text.includes("only after approval"));

  const directCommand = "Review the revised menu before recording.";
  const directCommandNatural = context.reviseSecondDraft(
    directCommand,
    naturalOptions
  );
  const directCommandResult = context.reviseSecondDraft(
    directCommand,
    directOptions
  );
  assert.strictEqual(directCommandNatural.text, directCommand);
  assert.strictEqual(directCommandResult.text, directCommand);
  assert.deepStrictEqual(Array.from(directCommandResult.edits), []);
  assert.ok(!directCommandResult.changes.includes(directChange));
  assert.ok(
    !directCommandResult.ruleMatches.some((match) => match.ruleId === directRuleId)
  );

  [
    primaryDirect,
    simpleDirect,
    pluralDirect,
    multipleActionsDirect,
    protectedValuesDirect,
    urlDirect,
    negationDirect,
    conditionDirect,
    alreadyDirectResult,
    politeDirectResult,
    nonRequestDirect,
    supervisorDirect,
    quotedDirect,
    paragraphsDirect,
    directCommandResult
  ].forEach((result) => {
    [
      "Please to review",
      "Please you review",
      "Please could",
      "Please if",
      "Please were review",
      "Please hoping",
      "Please you could"
    ].forEach((fragment) => {
      assert.ok(
        !result.text.includes(fragment),
        `Unexpected malformed Direct output: ${fragment}`
      );
    });

    result.edits.forEach((edit) => {
      if (edit.ruleId === directRuleId) {
        assert.ok(
          result.text.includes(edit.after),
          `Stale Direct edit-map value: ${edit.after}`
        );
      }
    });
  });
}

function testSecondDraftDirectModalityPreservation() {
  const context = loadSecondDraftContext();
  const naturalOptions = {
    tone: "natural",
    length: "same",
    reflow: false
  };
  const directOptions = {
    tone: "direct",
    length: "same",
    reflow: false
  };
  const directChange =
    "Rewrote hesitant request framing into a clear, professional action";
  const directRuleId = "SD-CLARITY-002";
  const unchangedFixtures = [
    "The event may be canceled if severe weather continues.",
    "Staff may enter the building after 8:00 a.m.",
    "The new system can process longer scripts.",
    "The launch will probably be delayed if approval arrives after Tuesday.",
    "I think the revised menu is ready for review.",
    "We believe the script needs another review.",
    "It seems that the event dates do not match the approved schedule.",
    "The recording might fail if the SSML contains invalid XML.",
    "You should review the dates before recording.",
    "You must approve the script before recording begins.",
    "The library may not approve the revised menu.",
    "The team may be able to finish by Tuesday, but the schedule will probably remain tight.",
    "The director said, \u201cThe launch will probably be delayed.\u201d",
    "The service may return HTTP 429 when the request limit is exceeded.",
    "Members may renew eligible items twice.",
    "Please approve the revised menu by Tuesday.",
    "I think approval may arrive by Tuesday, July 28. Questions can be sent to support@example.com.",
    "The IVR may route callers incorrectly if option 4 is removed.",
    "The contractor may terminate the agreement after thirty days\u2019 notice.",
    "The update will probably affect 20 to 30 records.",
    "The reviewer wrote, \u201cI think the introduction is too long.\u201d"
  ];
  const obsoleteChanges = [
    "Removed hesitant phrasing",
    "Removed hesitation",
    "Removed uncertainty"
  ];
  const obsoleteEdits = [
    ["may", "can"],
    ["probably", ""],
    ["I think", ""],
    ["It seems that", ""]
  ];

  unchangedFixtures.forEach((input) => {
    const natural = context.reviseSecondDraft(input, naturalOptions);
    const direct = context.reviseSecondDraft(input, directOptions);

    assert.strictEqual(natural.text, input);
    assert.strictEqual(direct.text, input);
    obsoleteChanges.forEach((change) => {
      assert.ok(!direct.changes.includes(change));
    });
    obsoleteEdits.forEach(([before, after]) => {
      assert.ok(
        !direct.edits.some(
          (edit) => edit.before === before && edit.after === after
        )
      );
    });
  });

  const requestFixtures = [
    {
      input:
        "I was hoping you could confirm whether the event may be canceled.",
      expected: "Please confirm whether the event may be canceled."
    },
    {
      input:
        "I was wondering if you could confirm whether the launch will probably be delayed.",
      expected:
        "Please confirm whether the launch will probably be delayed."
    },
    {
      input:
        "We were hoping you could confirm that the library may not approve the menu.",
      expected:
        "Please confirm that the library may not approve the menu."
    }
  ];

  requestFixtures.forEach(({ input, expected }) => {
    const natural = context.reviseSecondDraft(input, naturalOptions);
    const direct = context.reviseSecondDraft(input, directOptions);

    assert.strictEqual(natural.text, input);
    assert.strictEqual(direct.text, expected);
    assert.deepStrictEqual(Array.from(direct.changes), [directChange]);
    assert.ok(
      direct.ruleMatches.some(
        (match) =>
          match.ruleId === directRuleId && match.change === directChange
      )
    );
    assert.ok(
      direct.edits.some(
        (edit) =>
          edit.before === input &&
          edit.after === expected &&
          edit.ruleId === directRuleId
      )
    );
    assert.ok(direct.edits.every((edit) => direct.text.includes(edit.after)));
    obsoleteChanges.forEach((change) => {
      assert.ok(!direct.changes.includes(change));
    });
    obsoleteEdits.forEach(([before, after]) => {
      assert.ok(
        !direct.edits.some(
          (edit) => edit.before === before && edit.after === after
        )
      );
    });
  });

  const possibility = context.reviseSecondDraft(
    unchangedFixtures[0],
    directOptions
  ).text;
  assert.ok(possibility.includes("may be canceled"));
  assert.ok(possibility.includes("if severe weather continues"));

  const permission = context.reviseSecondDraft(
    unchangedFixtures[1],
    directOptions
  ).text;
  assert.ok(permission.includes("may enter"));
  assert.ok(permission.includes("8:00 a.m."));

  const capability = context.reviseSecondDraft(
    unchangedFixtures[2],
    directOptions
  ).text;
  assert.ok(capability.includes("can process"));

  const probability = context.reviseSecondDraft(
    unchangedFixtures[3],
    directOptions
  ).text;
  assert.ok(probability.includes("probably"));
  assert.ok(probability.includes("if approval arrives after Tuesday"));

  const tentativeObservation = context.reviseSecondDraft(
    unchangedFixtures[6],
    directOptions
  ).text;
  assert.ok(tentativeObservation.includes("It seems that"));
  assert.ok(tentativeObservation.includes("do not match"));

  const risk = context.reviseSecondDraft(
    unchangedFixtures[7],
    directOptions
  ).text;
  assert.ok(risk.includes("might fail"));
  assert.ok(risk.includes("if the SSML contains invalid XML"));

  assert.ok(
    context
      .reviseSecondDraft(unchangedFixtures[8], directOptions)
      .text.includes("should review")
  );
  assert.ok(
    context
      .reviseSecondDraft(unchangedFixtures[9], directOptions)
      .text.includes("must approve")
  );

  const negatedPossibility = context.reviseSecondDraft(
    unchangedFixtures[10],
    directOptions
  ).text;
  assert.ok(negatedPossibility.includes("may not"));
  assert.ok(!negatedPossibility.includes("can not"));

  const multipleModals = context.reviseSecondDraft(
    unchangedFixtures[11],
    directOptions
  ).text;
  assert.ok(multipleModals.includes("may be able to"));
  assert.ok(multipleModals.includes("probably"));
  assert.ok(multipleModals.includes("Tuesday"));
  assert.ok(multipleModals.includes(", but "));
  assert.ok(!multipleModals.includes("can be able to"));

  assert.strictEqual(
    context.reviseSecondDraft(unchangedFixtures[12], directOptions).text,
    unchangedFixtures[12]
  );
  assert.strictEqual(
    context.reviseSecondDraft(unchangedFixtures[20], directOptions).text,
    unchangedFixtures[20]
  );

  const protectedValues = context.reviseSecondDraft(
    unchangedFixtures[16],
    directOptions
  ).text;
  assert.ok(protectedValues.includes("I think"));
  assert.ok(protectedValues.includes("may"));
  assert.ok(protectedValues.includes("Tuesday, July 28"));
  assert.ok(protectedValues.includes("support@example.com"));
  assert.ok(protectedValues.includes("Questions can be sent"));
}

function testSecondDraftStrengthPreservation() {
  const context = loadSecondDraftContext();
  const modes = [
    { name: "Natural", tone: "natural", length: "same" },
    { name: "Direct", tone: "direct", length: "same" },
    { name: "Shorter", tone: "natural", length: "shorter" },
    { name: "Direct + Shorter", tone: "direct", length: "shorter" }
  ];
  const fixtures = [
    "It may be helpful to review the event dates before recording.",
    "I think we should probably review the revised menu again.",
    "The main point is that we should review the dates before recording.",
    "We need to approve the script before recording begins.",
    "I would like to review the revised menu before it is published.",
    "Please be advised that the library will close at 5:00 p.m.",
    "The sign reads, \u201cPlease be advised that the library will close at 5:00 p.m.\u201d",
    "I wanted to reach out and ask whether you could review the revised menu.",
    "I wanted to reach out to see whether your team might be available to review the revised menu.",
    "I wanted to make sure we are aligned on the revised wording.",
    "I wanted to make sure we are aligned on the revised wording before sending it.",
    "I wanted to make sure we are aligned on who owns the next review.",
    "You should contact the library before recording.",
    "You must contact the library before recording.",
    "The script needs another review before recording.",
    "I would like to confirm the event dates.",
    "I would like to confirm the event dates before I send the script.",
    "Maria would like to confirm the event dates.",
    "Reviewing the event dates would probably be helpful.",
    "The director said, \u201cI think we should probably review the menu again.\u201d",
    "It may be helpful to review the dates. It may be helpful to confirm the phone numbers.",
    "We should not publish the script before approval.",
    "If approval arrives today, it may be helpful to begin recording tomorrow.",
    "I wanted to make sure the revised title is correct.",
    "It may be helpful to validate the SSML before calling the Amazon Polly API.",
    "I think we should probably confirm option 4 with the library before recording.",
    "Please be advised that recording begins after approval.",
    "I would like to thank you for reviewing the revised menu.",
    "I would like to let you know that the recording is complete.",
    "I think we should probably review the revised menu because the event dates may have changed."
  ];
  const mainPointChange =
    "Removed the main-point announcement while preserving the recommendation";
  const obsoleteChanges = [
    "Made a suggested action more direct",
    "Removed hesitation from the recommendation",
    "Made the message more direct while preserving intent",
    "Condensed the sentence into a shorter action statement",
    "Smoothed the sentence while preserving a natural tone",
    "Replaced alignment filler with a clearer next step",
    "Condensed alignment wording into a shorter action statement",
    "Simplified business clutter into clearer wording",
    "Made wording more direct",
    "Removed overly formal phrasing",
    "Removed hesitant phrasing",
    "Reduced hesitant phrasing",
    "Turned the main point into a direct action"
  ];

  fixtures.forEach((input, index) => {
    modes.forEach((mode) => {
      const result = context.reviseSecondDraft(input, {
        tone: mode.tone,
        length: mode.length,
        reflow: false
      });
      const isFocused = mode.tone === "direct" || mode.length === "shorter";
      const isMainPoint = index === 2;
      const expected =
        isMainPoint && isFocused
          ? "We should review the dates before recording."
          : input;

      assert.strictEqual(
        result.text,
        expected,
        `Unexpected ${mode.name} strength result for fixture ${index + 1}`
      );

      obsoleteChanges.forEach((change) => {
        assert.ok(
          !result.changes.includes(change),
          `Obsolete explanation in ${mode.name} fixture ${index + 1}: ${change}`
        );
      });

      assert.ok(!result.text.includes("I think we need to"));
      assert.ok(!result.text.includes("Let's confirm"));
      assert.ok(!result.text.includes("Let you know that"));

      if (isMainPoint && isFocused) {
        assert.deepStrictEqual(Array.from(result.changes), [mainPointChange]);
        assert.strictEqual(result.edits.length, 1);
        assert.strictEqual(result.edits[0].before, input);
        assert.strictEqual(result.edits[0].after, expected);
        assert.strictEqual(result.edits[0].ruleId, undefined);
        assert.ok(result.text.includes(result.edits[0].after));
        assert.ok(
          !result.ruleMatches.some(
            (match) => match.ruleId === "SD-CLARITY-002"
          )
        );
      }
    });
  });

  const mainPointCases = [
    {
      input:
        "The main point is that we should not publish the script before approval.",
      expected: "We should not publish the script before approval."
    },
    {
      input:
        "The main point is that we should review the dates if approval arrives before Tuesday.",
      expected:
        "We should review the dates if approval arrives before Tuesday."
    }
  ];

  mainPointCases.forEach(({ input, expected }) => {
    modes.forEach((mode) => {
      const result = context.reviseSecondDraft(input, {
        tone: mode.tone,
        length: mode.length,
        reflow: false
      });
      const isFocused = mode.tone === "direct" || mode.length === "shorter";

      assert.strictEqual(result.text, isFocused ? expected : input);

      if (isFocused) {
        assert.deepStrictEqual(Array.from(result.changes), [mainPointChange]);
        assert.deepStrictEqual(
          Array.from(result.edits).map((edit) => ({
            before: edit.before,
            after: edit.after,
            ruleId: edit.ruleId
          })),
          [{ before: input, after: expected, ruleId: undefined }]
        );
        assert.strictEqual(result.ruleMatches.length, 0);
      }
    });
  });

  const quotedMainPoint =
    "The editor wrote, \u201cThe main point is that we should review the dates.\u201d";
  modes.forEach((mode) => {
    const result = context.reviseSecondDraft(quotedMainPoint, {
      tone: mode.tone,
      length: mode.length,
      reflow: false
    });
    assert.strictEqual(result.text, quotedMainPoint);
    assert.ok(!result.changes.includes(mainPointChange));
  });

  const removedLegacyFixtures = [
    "I just wanted to reach out and let you know that I think it would probably be helpful to review the final script before recording.",
    "I wanted to reach out because I think it would probably be helpful to review the revised menu.",
    "I know everyone has been busy lately, but I wanted to make sure we were all aligned and on the same page regarding the final version.",
    "I wanted to make sure we agree on the final version.",
    "I think it would probably be helpful to review the menu.",
    "It would probably be helpful to review the menu."
  ];

  removedLegacyFixtures.forEach((input) => {
    modes.forEach((mode) => {
      const result = context.reviseSecondDraft(input, {
        tone: mode.tone,
        length: mode.length,
        reflow: false
      });

      assert.strictEqual(result.text, input);
      assert.ok(!result.text.includes("I think we need to"));
      assert.ok(!result.text.includes("Let's "));
      assert.ok(!result.text.includes("before sending it"));
      assert.deepStrictEqual(Array.from(result.edits), []);
    });
  });

  const request =
    "We were hoping you could confirm that the library may not approve the menu.";
  const requestDirect = context.reviseSecondDraft(request, {
    tone: "direct",
    length: "same",
    reflow: false
  });

  assert.strictEqual(
    requestDirect.text,
    "Please confirm that the library may not approve the menu."
  );
  assert.ok(
    requestDirect.ruleMatches.some(
      (match) => match.ruleId === "SD-CLARITY-002"
    )
  );
  assert.ok(
    requestDirect.edits.some(
      (edit) =>
        edit.ruleId === "SD-CLARITY-002" &&
        requestDirect.text.includes(edit.after)
    )
  );
}

function testSecondDraftShorterRedundancyReduction() {
  const context = loadSecondDraftContext();
  const repeated =
    "Please review the final draft before Tuesday. The schedule remains unchanged. Please review the final draft before Tuesday.";

  const shorter = context.reviseSecondDraft(repeated, {
    tone: "natural",
    length: "shorter",
    reflow: false
  });

  assert.strictEqual(
    shorter.text,
    "Please review the final draft before Tuesday. The schedule remains unchanged."
  );
  assert.ok(
    shorter.changes.includes("Removed repeated sentences to make the draft shorter")
  );
  assert.ok(
    shorter.edits.some(
      (edit) =>
        edit.ruleId === "SD-REPETITION-002" &&
        edit.before === "Please review the final draft before Tuesday."
    )
  );
  assert.ok(
    shorter.ruleMatches.some((match) => match.ruleId === "SD-REPETITION-002")
  );

  const sameLength = context.reviseSecondDraft(repeated, {
    tone: "natural",
    length: "same",
    reflow: false
  });
  assert.strictEqual(sameLength.text, repeated);

  const intentionalShortRepeat = "Thank you. The draft is ready. Thank you.";
  const preserved = context.reviseSecondDraft(intentionalShortRepeat, {
    tone: "natural",
    length: "shorter",
    reflow: false
  });
  assert.strictEqual(preserved.text, intentionalShortRepeat);

  const similarButDistinct =
    "Please review the final draft before Tuesday. Please approve the final draft before Tuesday.";
  const distinct = context.reviseSecondDraft(similarButDistinct, {
    tone: "natural",
    length: "shorter",
    reflow: false
  });
  assert.strictEqual(distinct.text, similarButDistinct);
}

function testSecondDraftTimeAbbreviationPreservation() {
  const context = loadSecondDraftContext();
  const modes = [
    { name: "Natural", tone: "natural", length: "same" },
    { name: "Direct", tone: "direct", length: "same" },
    { name: "Shorter", tone: "natural", length: "shorter" },
    { name: "Direct + Shorter", tone: "direct", length: "shorter" }
  ];
  const unchangedFixtures = [
    "The library will close at 5:00 p.m. today.",
    "Staff may enter after 8:00 a.m. on Monday.",
    "The library closes at 5:00 p.m. Recording begins after approval.",
    "Doors open at 8:00 a.m. Staff should arrive fifteen minutes early.",
    "The sign reads, \u201cThe library will close at 5:00 p.m.\u201d",
    "The morning session begins at 9:00 a.m., and the evening session begins at 6:30 p.m.",
    "The library is open from 9:00 a.m. to 5:00 p.m.",
    "Recording may begin after 3:00 p.m. if approval arrives today.",
    "The library closes at 5:00 p.m. The help desk closes at 6:00 p.m.",
    "Please be advised that the library will close at 5:00 p.m.",
    "The sign reads, \u201cPlease be advised that the library will close at 5:00 p.m.\u201d",
    "Use version 2.1. The updated instructions follow.",
    "The library closes at 5:00 p.m. on Tuesday, July 28. Questions can be sent to support@example.com or 914-555-0184.",
    "The source uses 5:00 P.M. and 8:00 a.M. in this exact style."
  ];
  const forbiddenTimeMutations = [
    "p. M.",
    "a. M.",
    "P. M."
  ];

  unchangedFixtures.forEach((input, index) => {
    modes.forEach((mode) => {
      const result = context.reviseSecondDraft(input, {
        tone: mode.tone,
        length: mode.length,
        reflow: false
      });

      assert.strictEqual(
        result.text,
        input,
        `Unexpected ${mode.name} time result for fixture ${index + 1}`
      );
      forbiddenTimeMutations.forEach((mutation) => {
        assert.ok(!result.text.includes(mutation));
      });
      assert.ok(
        !result.changes.some((change) =>
          /abbreviation|time normalization|fixed time/i.test(change)
        )
      );
      assert.deepStrictEqual(Array.from(result.edits), []);
    });
  });

  const lowercaseAfterPeriod =
    "The first draft is complete. review should begin tomorrow.";
  const capitalizedAfterPeriod =
    "The first draft is complete. Review should begin tomorrow.";

  modes.forEach((mode) => {
    const result = context.reviseSecondDraft(lowercaseAfterPeriod, {
      tone: mode.tone,
      length: mode.length,
      reflow: false
    });

    assert.strictEqual(result.text, capitalizedAfterPeriod);
    assert.ok(result.text.includes(". Review"));
  });

  const repeated =
    "The library closes at 5:00 p.m. The library closes at 5:00 p.m.";

  modes.forEach((mode) => {
    const result = context.reviseSecondDraft(repeated, {
      tone: mode.tone,
      length: mode.length,
      reflow: false
    });
    const isShorter = mode.length === "shorter";

    assert.strictEqual(
      result.text,
      isShorter ? "The library closes at 5:00 p.m." : repeated
    );
    assert.ok(result.text.includes("5:00 p.m."));
    assert.ok(!result.text.includes("p. M."));
    assert.ok(!result.text.includes("p. m."));
    assert.ok(!result.text.includes(".."));

    if (isShorter) {
      assert.strictEqual(
        result.text.match(/The library closes at 5:00 p\.m\./g).length,
        1
      );
      assert.ok(
        result.edits.some(
          (edit) =>
            edit.ruleId === "SD-REPETITION-002" &&
            edit.before === "The library closes at 5:00 p.m."
        )
      );
    }
  });

  const realBoundary =
    "The library closes at 5:00 p.m. Recording begins after approval.";
  const condition =
    "Recording may begin after 3:00 p.m. if approval arrives today.";
  const protectedValues =
    "The library closes at 5:00 p.m. on Tuesday, July 28. Questions can be sent to support@example.com or 914-555-0184.";

  modes.forEach((mode) => {
    const options = {
      tone: mode.tone,
      length: mode.length,
      reflow: false
    };
    const boundaryResult = context.reviseSecondDraft(realBoundary, options);
    const conditionResult = context.reviseSecondDraft(condition, options);
    const protectedResult = context.reviseSecondDraft(protectedValues, options);

    assert.ok(boundaryResult.text.includes("p.m. Recording"));
    assert.strictEqual(
      boundaryResult.text.split("Recording begins after approval.").length,
      2
    );
    assert.ok(conditionResult.text.includes("may begin"));
    assert.ok(conditionResult.text.includes("p.m. if approval arrives today"));
    assert.ok(protectedResult.text.includes("Tuesday, July 28"));
    assert.ok(protectedResult.text.includes("support@example.com"));
    assert.ok(protectedResult.text.includes("914-555-0184"));
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
  assert.ok(activeIds.includes("SD-REPETITION-001"));
  assert.ok(activeIds.includes("SD-REPETITION-002"));
  assert.ok(!activeIds.includes("SD-RHYTHM-001"));
  assert.ok(!activeIds.includes("SD-CLARITY-998"));
  assert.ok(!activeIds.includes("SD-CLARITY-997"));
  assert.strictEqual(registry.getRule("SD-RHYTHM-001"), null);

  const preservationRule = registry.getRule("SD-PRESERVE-001");
  assert.strictEqual(preservationRule.type, "preservation-rule");
  assert.strictEqual(preservationRule.automation, "explanation-only");

  const directActionRule = registry.getRule("SD-CLARITY-002");
  assert.strictEqual(
    directActionRule.name,
    "Rewrite a supported hesitant request"
  );
  assert.ok(
    directActionRule.triggerDescription.includes("Direct mode")
  );
  assert.strictEqual(
    directActionRule.source.reference,
    "rewriteSecondDraftHesitantRequests"
  );
  assert.strictEqual(directActionRule.examples.length, 1);
  assert.ok(
    !JSON.stringify(directActionRule).includes(
      "The main point is that we should"
    )
  );

  const exactRepetitionRule = registry.getRule("SD-REPETITION-002");
  assert.strictEqual(exactRepetitionRule.name, "Remove exact repeated sentences in Shorter mode");
  assert.strictEqual(
    exactRepetitionRule.source.reference,
    "reduceSecondDraftExactRedundancy"
  );

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
    [
      "Review the draft before sending it over. The wording could be clearer and more concise.",
      "",
      "The current version feels long and repetitive in places. We should review the message, tighten the language, and make sure it sounds professional but still natural.",
      "",
      "Tell me whether we should handle this today or tomorrow."
    ].join("\n")
  );
  assert.deepStrictEqual(Array.from(directShorter.changes), [
    "Rewrote a filler opening into a clearer sentence",
    "Condensed weak phrasing into a clearer sentence",
    "Removed setup wording and tightened the observation",
    "Tightened the timing question",
    "Removed the main-point announcement while preserving the recommendation"
  ]);

  const ruleIds = directShorter.ruleMatches.map((match) => match.ruleId);
  assert.ok(ruleIds.includes("SD-CLARITY-001"));
  assert.ok(ruleIds.includes("SD-COMPRESSION-001"));
  assert.ok(ruleIds.includes("SD-REPETITION-001"));
  assert.ok(!ruleIds.includes("SD-REPETITION-002"));
  assert.ok(!ruleIds.includes("SD-CLARITY-002"));
  assert.ok(directShorter.edits.some((edit) => edit.ruleId === "SD-CLARITY-001"));
  assert.ok(directShorter.edits.some((edit) => edit.ruleId === "SD-COMPRESSION-001"));
  assert.ok(
    directShorter.edits.some(
      (edit) =>
        edit.before ===
          "The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural." &&
        edit.after ===
          "We should review the message, tighten the language, and make sure it sounds professional but still natural." &&
        !edit.ruleId
    )
  );

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
    [
      "We should probably take a look at the draft before sending it over. This helps frame the main point more clearly. I think there are a few areas where the wording could be improved. It may be helpful to make it a little clearer and more concise.",
      "",
      "Also, the current version feels a bit long and maybe slightly repetitive in certain places. The main point is that we should review the message, tighten the language, and make sure it sounds professional but still natural.",
      "",
      "Let me know if you think this is something we should handle today or if it can wait until tomorrow."
    ].join("\n")
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

function testSecondDraftProfessionalToneSafetyReset() {
  const context = loadSecondDraftContext();
  const professional = {
    tone: "professional",
    length: "same",
    reflow: false
  };

  const collocations = [
    "Let's get started tomorrow.",
    "Please get back to me by Friday.",
    "We need to review the agreement.",
    "This will help explain the change.",
    "I can help prepare the final version.",
    "Please show the team the revised schedule.",
    "The group will get access after approval.",
    "We need help with the calendar feed.",
    "The report shows three unresolved issues.",
    "Please get the files from the shared folder.",
    "We have a lot of files to review."
  ];

  collocations.forEach((input) => {
    const result = context.reviseSecondDraft(input, professional);
    assert.strictEqual(result.text, input);
    assert.deepStrictEqual(Array.from(result.edits), []);
    assert.deepStrictEqual(Array.from(result.ruleMatches), []);
    assert.deepStrictEqual(Array.from(result.changes), [
      "No major revision needed. The text already reads cleanly."
    ]);

    [
      "receive started",
      "receive back",
      "require to review",
      "assist explain",
      "assist prepare",
      "demonstrate the team"
    ].forEach((malformed) => {
      assert.ok(!result.text.toLowerCase().includes(malformed));
    });
  });

  const preservationFixtures = [
    "The vendor may need to regenerate the audio.",
    "We should probably review the agreement before Friday.",
    "Rebecca needs to approve the files before Guy uploads them.",
    "Do not publish unless Rebecca confirms the date.",
    "The call is optional if email is sufficient.",
    "Please send the approved schedule by September 1, 2026.",
    "Meet at 9 a.m. or 2:30 p.m.",
    "Use DB 1-2-3-4-5-6 for the SSML and OTBS record.",
    "Email support@example.org and review https://example.org/calendar?feed=fall."
  ];

  preservationFixtures.forEach((input) => {
    const result = context.reviseSecondDraft(input, professional);
    assert.strictEqual(result.text, input);
    assert.deepStrictEqual(Array.from(result.edits), []);
    assert.deepStrictEqual(Array.from(result.ruleMatches), []);
  });

  const signature = "Thanks,\n\nGuy";
  assert.strictEqual(
    context.reviseSecondDraft(signature, professional).text,
    signature
  );

  const sharedCleanup = context.reviseSecondDraft(
    "We are writing to let you know that the review is ready. We are meeting in order to confirm the date.",
    professional
  );
  assert.strictEqual(
    sharedCleanup.text,
    "The review is ready. We are meeting to confirm the date."
  );
  assert.ok(
    sharedCleanup.ruleMatches.some(
      (match) => match.ruleId === "SD-CLARITY-001"
    )
  );
  assert.ok(
    sharedCleanup.ruleMatches.some(
      (match) => match.ruleId === "SD-COMPRESSION-001"
    )
  );

  const friendly = context.reviseSecondDraft(
    "You will receive access after approval.",
    {
      tone: "friendly",
      length: "same",
      reflow: false
    }
  );
  assert.strictEqual(friendly.text, "You will get access after approval.");
  assert.ok(friendly.changes.includes("Made wording more conversational"));
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

  assert.strictEqual(lineBreakResult.text, lineBreakSource);
  assert.ok(!lineBreakResult.changes.includes(reflowClaim));
  assert.ok(
    !lineBreakResult.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );
  assert.ok(lineBreakResult.changes.includes("No major revision needed. The text already reads cleanly."));
  assertNoTrailingWhitespace(lineBreakResult.text);
}

function testSecondDraftStructurePreservation() {
  const context = loadSecondDraftContext();
  const revise = (text, tone = "natural", length = "same", reflow = false) =>
    context.reviseSecondDraft(text, { tone, length, reflow });
  const reflowClaim = "Reflowed text into cleaner paragraphs";
  const userFixture = [
    "Calendar feeds or event links",
    "Desired go-live timeline",
    "Happy to schedule a quick call if that would be easier.",
    "Thanks,",
    "Guy"
  ].join("\n");

  ["natural", "concise", "professional", "friendly", "direct"].forEach((tone) => {
    assert.strictEqual(revise(userFixture, tone).text, userFixture);
    assert.strictEqual(revise(userFixture, tone, "same", true).text, userFixture);
  });

  const bulletItems = [
    "Please send the following:",
    "- Calendar feed",
    "- Desired go-live date",
    "- Primary contact",
    "- Approval status"
  ].join("\n");
  [false, true].forEach((reflow) => {
    assert.strictEqual(revise(bulletItems, "natural", "same", reflow).text, bulletItems);
  });

  ["*", "•"].forEach((marker) => {
    const source = `Please send the following:\n${marker} Calendar feed\n${marker} Approval status`;
    assert.strictEqual(revise(source, "natural", "same", true).text, source);
  });

  const numbered = [
    "Please review:",
    "1. Main menu",
    "2. Events calendar",
    "3. Adult fiction",
    "4. Adult nonfiction"
  ].join("\n");
  const numberedParenthesis = "Please review:\n1) Main menu\n2) Events calendar";
  [false, true].forEach((reflow) => {
    assert.strictEqual(revise(numbered, "natural", "same", reflow).text, numbered);
    assert.strictEqual(
      revise(numberedParenthesis, "natural", "same", reflow).text,
      numberedParenthesis
    );
  });

  const labels = [
    "Library: RHPL",
    "Season: Fall 2026",
    "Go-live: September 1, 2026",
    "Approval: Rebecca LaFave",
    "Audio status: Ready for review",
    "Calendar feed: https://example.org/calendar?feed=fall"
  ].join("\n");
  [false, true].forEach((reflow) => {
    assert.strictEqual(revise(labels, "natural", "same", reflow).text, labels);
  });

  ["Thanks,", "Best,", "Regards,", "Sincerely,"].forEach((signoff) => {
    const signature = [
      signoff,
      "Guy Teichman",
      "Solutions Consultant",
      "support@example.org",
      "914-555-0123"
    ].join("\n");
    [false, true].forEach((reflow) => {
      assert.strictEqual(revise(signature, "natural", "same", reflow).text, signature);
    });
  });

  const message = [
    "Hi Rebecca,",
    "",
    "The fall audio update is ready for review.",
    "",
    "Please let me know whether the calendar feed has changed.",
    "",
    "Thanks,",
    "Guy"
  ].join("\n");
  [false, true].forEach((reflow) => {
    assert.strictEqual(revise(message, "natural", "same", reflow).text, message);
  });

  const hardWrapped = [
    "The fall update is ready for review and",
    "includes the revised calendar and audio",
    "files for the new season."
  ].join("\n");
  const hardWrappedExpected =
    "The fall update is ready for review and includes the revised calendar and audio files for the new season.";
  assert.strictEqual(revise(hardWrapped).text, hardWrapped);
  const hardWrappedResult = revise(hardWrapped, "natural", "same", true);
  assert.strictEqual(hardWrappedResult.text, hardWrappedExpected);
  assert.ok(hardWrappedResult.changes.includes(reflowClaim));
  assert.ok(
    hardWrappedResult.ruleMatches.some((match) => match.ruleId === "SD-STRUCTURE-001")
  );

  const mixed = [
    "Hi Rebecca,",
    "",
    "The fall update is ready for review and",
    "includes the revised audio files.",
    "",
    "Please confirm:",
    "- Calendar feed",
    "- Desired go-live date",
    "",
    "Happy to schedule a quick call if that would be easier.",
    "",
    "Thanks,",
    "Guy"
  ].join("\n");
  const mixedExpected = mixed.replace(
    "The fall update is ready for review and\nincludes the revised audio files.",
    "The fall update is ready for review and includes the revised audio files."
  );
  assert.strictEqual(revise(mixed, "direct", "same", true).text, mixedExpected);

  const fragments = [
    "Required materials",
    "Calendar feeds or event links",
    "Desired go-live timeline",
    "Approval contact"
  ].join("\n");
  assert.strictEqual(revise(fragments, "natural", "same", true).text, fragments);

  const conditions = [
    "Do not replace the summer content until approval.",
    "Only upload the files after Rebecca confirms.",
    "The call is optional if email is sufficient."
  ].join("\n");
  [false, true].forEach((reflow) => {
    assert.strictEqual(revise(conditions, "natural", "same", reflow).text, conditions);
  });

  const protectedValues = [
    "Start time: 9 a.m.",
    "End time: 2:30 p.m.",
    "Go-live: September 1, 2026",
    "Code: DB 1-2-3-4-5-6",
    "Email: support@example.org",
    "Calendar feed: https://example.org/calendar?feed=fall",
    "Phone: 914-555-0123",
    "Menu: Option 3",
    "Format: SSML",
    "System: OTBS",
    "Season: Fall 2026"
  ].join("\n");
  [false, true].forEach((reflow) => {
    assert.strictEqual(
      revise(protectedValues, "natural", "same", reflow).text,
      protectedValues
    );
  });

  ["natural", "concise", "professional", "friendly", "direct"].forEach((tone) => {
    ["same", "shorter", "expand"].forEach((length) => {
      [false, true].forEach((reflow) => {
        const result = revise(userFixture, tone, length, reflow);
        assert.strictEqual(result.text, userFixture);
      });
    });
  });
}

function testEditorialComponentsFoundation() {
  const registry = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "data", "editorial-demonstrations.json"),
      "utf8"
    )
  );
  assert.strictEqual(registry.schemaVersion, 1);
  assert.strictEqual(registry.demonstrations.length, 1);
  const demo = registry.demonstrations[0];
  assert.strictEqual(demo.id, "DEMO-001");
  assert.strictEqual(demo.classification, "recorded-replay");
  assert.deepStrictEqual(Array.from(demo.componentModes), ["compare", "replay"]);
  assert.deepStrictEqual(demo.engine.options, {
    tone: "natural",
    length: "same",
    reflow: false
  });
  assert.strictEqual(demo.engine.adapter, null);
  assert.deepStrictEqual(
    demo.comparison.versions.map((version) => version.engineCommit),
    ["6774224", "2d9454d"]
  );
  assert.deepStrictEqual(
    demo.comparison.versions.map((version) => version.label),
    ["Previous engine behavior", "Current verified behavior"]
  );
  assert.strictEqual(demo.steps.length, 3);
  assert.deepStrictEqual(demo.rules, ["SD-STRUCTURE-001"]);
  assert.deepStrictEqual(demo.regressions, ["SecondDraft structure preservation"]);
  assert.deepStrictEqual(demo.destinations, [{
    surface: "journal",
    file: "journal-engine-room-line-breaks-are-part-of-the-meaning.html",
    rootSelector: '[data-demo-id="DEMO-001"]'
  }]);

  const context = loadSecondDraftContext();
  const first = context.reviseSecondDraft(
    demo.fixture.input,
    demo.engine.options
  );
  const second = context.reviseSecondDraft(
    demo.fixture.input,
    demo.engine.options
  );
  assert.strictEqual(first.text, demo.fixture.output);
  assert.strictEqual(second.text, demo.fixture.output);
  assert.strictEqual(first.text.split("\n").length, 5);
  assert.ok(first.text.includes("Happy to schedule a quick call if that would be easier."));
  assert.ok(first.text.includes("Thanks,\nGuy"));

  const historicalSource = spawnSync(
    "git",
    ["show", "6774224:js/second-draft.js"],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.strictEqual(historicalSource.status, 0, historicalSource.stderr);
  const historicalContext = createContext();
  vm.runInContext(historicalSource.stdout, historicalContext, {
    filename: "6774224:js/second-draft.js"
  });
  const historicalFirst = historicalContext.reviseSecondDraft(
    demo.fixture.input,
    demo.engine.options
  ).text;
  const historicalSecond = historicalContext.reviseSecondDraft(
    demo.fixture.input,
    demo.engine.options
  ).text;
  assert.strictEqual(historicalFirst, historicalSecond);
  assert.strictEqual(
    historicalFirst,
    demo.comparison.versions[0].output
  );
  assert.notStrictEqual(historicalFirst, demo.fixture.output);
  assert.strictEqual(historicalFirst.split("\n").length, 1);
  assert.strictEqual(demo.fixture.output.split("\n").length, 5);
  assert.deepStrictEqual(
    demo.steps.map((step) => step.text),
    [demo.fixture.input, historicalFirst, demo.fixture.output]
  );

  const runtimeSource = fs.readFileSync(
    path.join(ROOT, "js", "editorial-components.js"),
    "utf8"
  );
  assert.ok(!runtimeSource.includes("reviseSecondDraft"));
  assert.ok(!runtimeSource.includes(demo.fixture.output));
  assert.ok(!/replace\s*\([^)]*(?:hoping|Calendar feeds|Thanks,)/.test(runtimeSource));
  assert.ok(runtimeSource.includes('"Step through the repair", "play"'));
  assert.ok(runtimeSource.includes('"Start over", "restart"'));
  assert.ok(runtimeSource.includes('"Show repaired result", "final"'));
  assert.ok(runtimeSource.includes("`${step.label} — ${state.index + 1} of ${state.steps.length}`"));
  assert.ok(runtimeSource.includes('"Comparison displayed side by side."'));
  assert.ok(runtimeSource.includes('"Comparison displayed in a stacked layout."'));
  assert.ok(runtimeSource.includes("const replayIntervalMs = 2000;"));
  assert.ok(runtimeSource.includes("}, replayIntervalMs);"));
  assert.ok(!runtimeSource.includes("}, 1100);"));
  assert.ok(
    runtimeSource.indexOf("if (state.index === state.steps.length - 1) stop();") <
      runtimeSource.indexOf("updateDisabled();", runtimeSource.indexOf("function renderStep"))
  );
  assert.ok(runtimeSource.includes('renderStep(state.index - 1);'));
  assert.ok(runtimeSource.includes('renderStep(state.index + 1);'));
  assert.ok(runtimeSource.includes('renderStep(0, "Showing the original source.");'));
  assert.ok(
    runtimeSource.includes(
      'renderStep(state.steps.length - 1, "Showing the current verified output.");'
    )
  );
  assert.ok(!runtimeSource.includes('"Play comparison", "play"'));
  assert.ok(!runtimeSource.includes('"Restart", "restart"'));
  assert.ok(!runtimeSource.includes('"Show current output", "final"'));
  const componentCss = fs.readFileSync(
    path.join(ROOT, "css", "editorial-components.css"),
    "utf8"
  );
  assert.ok(
    componentCss.includes(
      'html[data-theme="terminal"] .editorial-demo .editorial-demo__control--secondary'
    )
  );
  assert.ok(
    componentCss.includes(
      'html[data-theme="terminal"] .editorial-demo .editorial-demo__control--tertiary'
    )
  );
  assert.ok(
    componentCss.includes(
      'html[data-theme="terminal"] .editorial-demo .editorial-demo__control:disabled'
    )
  );
  assert.ok(componentCss.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(componentCss.includes("transition: none !important;"));
  const runtimeContext = createContext();
  let registryFetches = 0;
  runtimeContext.window.fetch = () => {
    registryFetches += 1;
    return Promise.resolve({
      ok: true,
      json() {
        return Promise.resolve(registry);
      }
    });
  };
  loadScript("js/editorial-components.js", runtimeContext);
  const runtime = runtimeContext.window.PasteLintEditorialComponents;
  assert.ok(runtime);
  const firstRegistryRequest = runtime.loadRegistry("/registry.json");
  const secondRegistryRequest = runtime.loadRegistry("/registry.json");
  assert.strictEqual(firstRegistryRequest, secondRegistryRequest);
  assert.strictEqual(registryFetches, 1);
  assert.strictEqual(
    runtime.eventFor(demo, "compare-toggle"),
    "Editorial Demo | DEMO-001 | compare-toggle"
  );
  assert.strictEqual(runtime.eventFor(demo, "experiment-run"), "");
  assert.strictEqual(runtime.fixedMessages.data, "Demonstration data unavailable");
  assert.strictEqual(runtime.fixedMessages.draft, "Demonstration not yet verified.");
  assert.strictEqual(runtime.fixedMessages["recheck-required"], "Recheck required.");
  assert.strictEqual(runtime.fixedMessages.retired, "Historical demonstration.");
  [
    ["draft", "Demonstration not yet verified."],
    ["recheck-required", "Recheck required."],
    ["retired", "Historical demonstration."]
  ].forEach(([status, expected]) => {
    const statusElement = { textContent: "" };
    const rootElement = {
      dataset: {},
      querySelector() {
        return statusElement;
      }
    };
    const record = { ...demo, status };
    assert.strictEqual(runtime.enhance(rootElement, record), null);
    assert.strictEqual(statusElement.textContent, expected);
    assert.strictEqual(rootElement.dataset.demoEnhanced, "failed");
  });

  const fixtureHtml = fs.readFileSync(
    path.join(ROOT, "tests", "fixtures", "editorial-components-demo-001.html"),
    "utf8"
  );
  assert.ok(fixtureHtml.includes('content="noindex, nofollow"'));
  assert.ok(fixtureHtml.includes("Internal QA fixture"));
  assert.ok(fixtureHtml.includes('data-demo-id="DEMO-001"'));
  assert.ok(fixtureHtml.includes('data-demo-field="classification"'));
  assert.ok(fixtureHtml.includes('data-demo-field="title"'));
  assert.ok(fixtureHtml.includes('data-demo-field="source"'));
  assert.ok(fixtureHtml.includes('data-demo-field="output"'));
  assert.ok(fixtureHtml.includes('data-demo-field="previous-output"'));
  assert.ok(fixtureHtml.includes('data-demo-field="limitation"'));
  assert.ok(fixtureHtml.includes(demo.fixture.input));
  assert.ok(fixtureHtml.includes(demo.fixture.output));

  const validator = path.join(ROOT, "scripts", "validate-demonstrations.mjs");
  const canonicalResult = spawnSync(process.execPath, [validator], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.strictEqual(canonicalResult.status, 0, canonicalResult.stderr);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pastelint-demo-"));
  const verifiedBase = JSON.parse(JSON.stringify(registry));
  verifiedBase.demonstrations[0].status = "verified";
  verifiedBase.demonstrations[0].accessibility = {
    staticFallback: true,
    reducedMotion: true,
    textAlternative: true
  };

  const failures = [
    ["duplicate ID", (data) => data.demonstrations.push({ ...data.demonstrations[0], slug: "other-slug" })],
    ["duplicate slug", (data) => data.demonstrations.push({ ...data.demonstrations[0], id: "DEMO-002" })],
    ["schema", (data) => { data.schemaVersion = 2; }],
    ["classification", (data) => { data.demonstrations[0].classification = "unknown"; }],
    ["status", (data) => { data.demonstrations[0].status = "unknown"; }],
    ["mode", (data) => { data.demonstrations[0].componentModes = ["inspect"]; }],
    ["missing output", (data) => { data.demonstrations[0].fixture.output = ""; }],
    ["missing commit", (data) => { data.demonstrations[0].comparison.versions[0].engineCommit = ""; }],
    ["invalid commit", (data) => { data.demonstrations[0].comparison.versions[1].engineCommit = "XYZ"; }],
    ["invalid date", (data) => { data.demonstrations[0].captureDate = "2026-02-30"; }],
    ["limitation", (data) => { data.demonstrations[0].limitations = []; }],
    ["accessibility", (data) => { delete data.demonstrations[0].accessibility.staticFallback; }],
    ["analytics action", (data) => { data.demonstrations[0].analytics[0] = "Editorial Demo | DEMO-001 | experiment-run"; }],
    ["analytics ID", (data) => { data.demonstrations[0].analytics[0] = "Editorial Demo | DEMO-002 | replay-start"; }],
    ["analytics email", (data) => { data.demonstrations[0].analytics[0] = "Editorial Demo | DEMO-001 | support@example.org"; }],
    ["analytics URL", (data) => { data.demonstrations[0].analytics[0] = "Editorial Demo | DEMO-001 | https://example.org/?q=x"; }],
    ["rule", (data) => { data.demonstrations[0].rules = ["SD-MISSING-999"]; }],
    ["regression", (data) => { data.demonstrations[0].regressions = ["Missing regression"]; }],
    ["module", (data) => { data.demonstrations[0].engine.module = "js/missing.js"; }],
    ["adapter", (data) => { data.demonstrations[0].engine.adapter = "fake"; }],
    ["step text", (data) => { delete data.demonstrations[0].steps[0].text; }],
    ["step ID", (data) => { data.demonstrations[0].steps[1].id = data.demonstrations[0].steps[0].id; }]
  ];

  try {
    failures.forEach(([name, mutate], index) => {
      const candidate = JSON.parse(JSON.stringify(verifiedBase));
      mutate(candidate);
      const file = path.join(tempRoot, `invalid-${index}.json`);
      fs.writeFileSync(file, JSON.stringify(candidate, null, 2));
      const result = spawnSync(process.execPath, [validator, "--registry", file], {
        cwd: ROOT,
        encoding: "utf8"
      });
      assert.notStrictEqual(result.status, 0, `${name} unexpectedly passed`);
    });

    const driftCases = [
      ["title", (html) => html.replace("Line structure survives revision", "Wrong title")],
      ["source", (html) => html.replace("Calendar feeds or event links\nDesired", "Calendar feeds or event links Desired")],
      ["output", (html) => html.replace("Current verified behavior</h3>\n          <pre data-demo-field=\"output\">Calendar", "Current verified behavior</h3>\n          <pre data-demo-field=\"output\">Changed Calendar")],
      ["previous output", (html) => html.replace("Calendar feeds or event links Desired", "Changed Calendar feeds or event links Desired")],
      ["limitation", (html) => html.replace('data-demo-field="limitation"', 'data-demo-field="missing-limitation"')],
      ["classification", (html) => html.replace("Recorded Replay · Captured", "Live Engine · Captured")],
      ["field marker", (html) => html.replace('data-demo-field="source"', 'data-demo-field="missing-source"')]
    ];
    driftCases.forEach(([name, mutate], index) => {
      const htmlFile = path.join(tempRoot, `drift-${index}.html`);
      fs.writeFileSync(htmlFile, mutate(fixtureHtml));
      const candidate = JSON.parse(JSON.stringify(verifiedBase));
      candidate.demonstrations[0].destinations = [{
        surface: "documentation",
        file: path.relative(ROOT, htmlFile).replace(/\\/g, "/"),
        rootSelector: '[data-demo-id="DEMO-001"]'
      }];
      const registryFile = path.join(tempRoot, `drift-${index}.json`);
      fs.writeFileSync(registryFile, JSON.stringify(candidate, null, 2));
      const result = spawnSync(
        process.execPath,
        [validator, "--registry", registryFile],
        { cwd: ROOT, encoding: "utf8" }
      );
      assert.notStrictEqual(result.status, 0, `${name} drift unexpectedly passed`);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function testLineBreaksArticlePublication() {
  const articleFile = "journal-engine-room-line-breaks-are-part-of-the-meaning.html";
  const articlePath = path.join(ROOT, articleFile);
  assert.ok(fs.existsSync(articlePath));
  const html = fs.readFileSync(articlePath, "utf8");
  const styles = fs.readFileSync(path.join(ROOT, "css", "styles.css"), "utf8");
  const componentStyles = fs.readFileSync(
    path.join(ROOT, "css", "editorial-components.css"),
    "utf8"
  );
  const allStyles = `${styles}\n${componentStyles}`;
  const cssRuleBody = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = allStyles.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
    assert.ok(match, `Missing CSS selector: ${selector}`);
    return match[1];
  };
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "journal-manifest.json"), "utf8")
  );
  const registry = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "data", "editorial-demonstrations.json"),
      "utf8"
    )
  );
  const indexHtml = fs.readFileSync(
    path.join(ROOT, "text-preparation-journal.html"),
    "utf8"
  );
  const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const demo = registry.demonstrations.find((item) => item.id === "DEMO-001");
  const article = manifest.articles.find(
    (item) => item.slug === "line-breaks-are-part-of-the-meaning"
  );
  const canonical =
    "https://guyt1225.github.io/pastelint/" + articleFile;

  assert.ok(html.includes("<title>Line Breaks Are Part of the Meaning | PasteLint</title>"));
  assert.ok(html.includes("<h1>Line Breaks Are Part of the Meaning</h1>"));
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}" />`));
  assert.ok(
    html.includes(
      'class="journal-surface journal-track--engine-room engine-room-article line-breaks-article"'
    )
  );
  assert.ok(html.includes('<span class="journal-author">By Guy Teichman</span>'));
  assert.ok(html.includes('<time datetime="2026-07-29">Published July 29, 2026</time>'));
  assert.ok(html.includes('<meta property="article:published_time" content="2026-07-29" />'));
  assert.ok(html.includes('<meta property="article:modified_time" content="2026-08-03" />'));

  const jsonLd = [...html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )].map((match) => JSON.parse(match[1]));
  const articleJsonLd = jsonLd.find((item) => item["@type"] === "Article");
  const breadcrumbJsonLd = jsonLd.find(
    (item) => item["@type"] === "BreadcrumbList"
  );
  assert.ok(articleJsonLd);
  assert.strictEqual(articleJsonLd.headline, "Line Breaks Are Part of the Meaning");
  assert.strictEqual(articleJsonLd.datePublished, "2026-07-29");
  assert.strictEqual(articleJsonLd.dateModified, "2026-08-03");
  assert.strictEqual(articleJsonLd.author.name, "Guy Teichman");
  assert.strictEqual(articleJsonLd.mainEntityOfPage, canonical);
  assert.ok(breadcrumbJsonLd);
  assert.strictEqual(breadcrumbJsonLd.itemListElement.length, 3);

  assert.strictEqual((html.match(/data-demo-id="DEMO-001"/g) || []).length, 1);
  assert.ok(html.includes('data-demo-registry="data/editorial-demonstrations.json"'));
  assert.ok(html.includes('href="css/editorial-components.css"'));
  assert.ok(html.includes('src="js/editorial-components.js"'));
  assert.ok(!html.includes('src="js/second-draft.js"'));
  assert.ok(!html.includes("reviseSecondDraft"));
  assert.ok(!html.includes("function revise"));
  assert.deepStrictEqual(demo.comparison.defaultVersionIds, ["previous", "current"]);
  const articleDemoPrimaryRule = cssRuleBody(
    ".line-breaks-article .editorial-demo--article .editorial-demo__control--primary"
  );
  const terminalDemoPrimaryRule = cssRuleBody(
    'html[data-theme="terminal"] .line-breaks-article .editorial-demo--article .editorial-demo__control--primary'
  );
  assert.ok(articleDemoPrimaryRule.includes("min-height: 44px;"));
  assert.ok(articleDemoPrimaryRule.includes("background: transparent;"));
  assert.ok(
    articleDemoPrimaryRule.includes(
      "border: 2px solid var(--journal-track-accent);"
    )
  );
  assert.ok(articleDemoPrimaryRule.includes("font-weight: 750;"));
  assert.ok(articleDemoPrimaryRule.includes("box-shadow: none;"));
  assert.ok(!articleDemoPrimaryRule.includes("background: var(--accent);"));
  assert.ok(
    componentStyles.includes(
      ".line-breaks-article .editorial-demo--article .editorial-demo__control--primary:focus-visible {"
    )
  );
  assert.ok(terminalDemoPrimaryRule.includes("color: var(--accent);"));
  assert.ok(terminalDemoPrimaryRule.includes("background: transparent;"));
  assert.ok(terminalDemoPrimaryRule.includes("box-shadow: none;"));
  assert.ok(!terminalDemoPrimaryRule.includes("var(--warning)"));
  assert.ok(!terminalDemoPrimaryRule.includes("var(--journal-track-accent)"));
  assert.ok(
    componentStyles.includes(
      'html[data-theme="terminal"] .line-breaks-article .editorial-demo--article .editorial-demo__control--primary:focus-visible {'
    )
  );
  assert.ok(componentStyles.includes("outline-color: var(--accent);"));

  const explanationIndex = html.indexOf('data-demo-explanation="DEMO-001"');
  const demoIndex = html.indexOf('data-demo-id="DEMO-001"');
  assert.ok(explanationIndex >= 0 && explanationIndex < demoIndex);
  const explanation = html.slice(explanationIndex, demoIndex);
  assert.ok(explanation.includes("collapsed this five-line message into one paragraph"));
  assert.ok(
    explanation.includes(
      "The repaired output matches the original because preservation&mdash;not rewriting&mdash;is the intended result."
    )
  );
  assert.ok(explanation.includes("<dt>Original source</dt>"));
  assert.ok(explanation.includes("<dd><strong>5</strong> lines</dd>"));
  assert.ok(explanation.includes("<dt>Previous engine</dt>"));
  assert.ok(explanation.includes("<dd><strong>1</strong> line</dd>"));
  assert.ok(explanation.includes("<dt>Current engine</dt>"));
  assert.ok(explanation.includes("<dd><strong>5</strong> lines preserved</dd>"));
  assert.ok(!/<details\b|(?:^|\s)hidden(?:\s|=|>)/.test(explanation));

  assert.ok(html.includes("Recorded Replay &middot; Captured from PasteLint engine commits 6774224 and 2d9454d"));
  assert.ok(html.includes('<h2 data-demo-field="title">Line structure survives revision</h2>'));
  assert.ok(html.includes('data-demo-field="source"'));
  assert.ok(html.includes('data-demo-field="previous-output"'));
  assert.ok(html.includes('data-demo-field="output"'));
  assert.ok(html.includes('data-demo-field="limitation"'));
  assert.ok(html.includes('data-demo-field="caption"'));
  assert.ok(html.includes('data-demo-field="takeaway"'));
  assert.ok(html.includes("editorial-demo__state--source-reference"));
  assert.ok(html.includes(demo.fixture.input));
  assert.ok(html.includes(demo.comparison.versions[0].output));
  assert.ok(
    html.includes(
      "The current output matches the source because the engine is preserving the structure rather than rewriting it."
    )
  );
  assert.ok(
    html.includes(
      "This comparison demonstrates one repaired fixture and does not establish that every newline is semantic."
    )
  );
  assert.ok(html.includes('class="line-breaks-evidence-trail"'));
  assert.ok(html.includes('class="structure-repair-layout"'));
  assert.ok(html.includes("What the engine is preserving"));
  assert.ok(html.includes('class="line-role-specimen"'));
  assert.ok(html.includes("<code>Calendar feeds or event links</code>"));
  assert.ok(html.includes("<dd>Label or requested item</dd>"));
  assert.ok(html.includes("<code>Desired go-live timeline</code>"));
  assert.ok(html.includes("<dd>Separate requirement</dd>"));
  assert.ok(html.includes("<code>Thanks,</code>"));
  assert.ok(html.includes("<dd>Signoff</dd>"));
  assert.ok(html.includes("<code>Guy</code>"));
  assert.ok(html.includes("<dd>Signature</dd>"));
  assert.ok(html.includes("A line break is evidence, not proof."));
  assert.ok(html.includes('class="repair-sequence"'));
  assert.ok(html.includes("<strong>Reflow off</strong>"));
  assert.ok(html.includes("<strong>Reflow on</strong>"));
  assert.ok(html.includes("<strong>Uncertain structure</strong>"));

  const evidenceBoundaryIndex = html.indexOf(
    'class="line-breaks-evidence-trail evidence-boundary-region"'
  );
  const conclusionIndex = html.indexOf('class="line-breaks-conclusion"');
  assert.ok(evidenceBoundaryIndex >= 0);
  assert.ok(conclusionIndex > evidenceBoundaryIndex);
  const evidenceBoundary = html.slice(
    evidenceBoundaryIndex,
    conclusionIndex
  );
  assert.ok(evidenceBoundary.includes("Evidence and boundary"));
  assert.ok(evidenceBoundary.includes("Verified against"));
  assert.ok(evidenceBoundary.includes("The claim stops here"));
  [
    "6774224",
    "2d9454d",
    "Natural",
    "Keep similar",
    "SD-STRUCTURE-001",
    "SecondDraft structure preservation",
    "July 29, 2026",
    "Recorded Replay"
  ].forEach((value) => assert.ok(evidenceBoundary.includes(value)));
  [
    "one repaired fixture",
    "every newline is semantic",
    "universal document understanding",
    "arbitrary Markdown, tables, poetry, or source code",
    "conservatively unreflowed",
    "Recorded Replay accepts no reader input",
    "named commits and verification date",
    "High-stakes documents still require human review"
  ].forEach((value) => assert.ok(evidenceBoundary.includes(value)));

  assert.ok(
    html.includes(
      "Preserving words is insufficient when line boundaries carry document roles."
    )
  );
  assert.ok(
    html.includes(
      "Sometimes the correct revision is to leave both the words and their arrangement alone."
    )
  );
  assert.ok(html.includes('class="line-breaks-closing"'));
  assert.ok(html.includes("Revise the wording without surrendering the structure."));
  const ctaIndex = html.indexOf('class="line-breaks-closing-cta"');
  const shareIndex = html.indexOf('class="journal-share line-breaks-closing-share"');
  const relatedIndex = html.indexOf('class="line-breaks-related"');
  assert.ok(ctaIndex >= 0 && ctaIndex < shareIndex && shareIndex < relatedIndex);
  assert.ok(
    /<a class="line-breaks-primary-action" href="second-draft\.html" data-statkit-event="Journal CTA \| line-breaks-are-part-of-the-meaning \| second-draft">/.test(
      html
    )
  );
  assert.ok(html.includes("<span>Open SecondDraft</span>"));
  assert.ok(html.includes('<span aria-hidden="true">&rarr;</span>'));
  const primaryActionRule = cssRuleBody(
    ".line-breaks-article .line-breaks-primary-action"
  );
  const terminalActionRule = cssRuleBody(
    'html[data-theme="terminal"] .line-breaks-article .line-breaks-primary-action'
  );
  const shareActionRule = cssRuleBody(
    ".line-breaks-article .line-breaks-closing-share .journal-share-button"
  );
  assert.ok(
    styles.includes(
      ".line-breaks-article .line-breaks-primary-action:focus-visible {"
    )
  );
  assert.ok(
    styles.includes(
      ".line-breaks-article .line-breaks-closing-share .journal-share-button:focus-visible {"
    )
  );
  assert.ok(primaryActionRule.includes("min-height: 44px;"));
  assert.ok(primaryActionRule.includes("background: transparent;"));
  assert.ok(
    primaryActionRule.includes(
      "border-bottom: 3px solid var(--journal-track-accent);"
    )
  );
  assert.ok(!primaryActionRule.includes("background: var(--journal-track-accent);"));
  assert.ok(!primaryActionRule.includes("border: 2px solid"));
  assert.ok(terminalActionRule.includes("background: transparent;"));
  assert.ok(terminalActionRule.includes("color: var(--accent);"));
  assert.ok(terminalActionRule.includes("border-bottom-color: var(--accent);"));
  assert.ok(!terminalActionRule.includes("var(--journal-track-accent)"));
  assert.ok(!terminalActionRule.includes("var(--warning)"));
  assert.ok(shareActionRule.includes("min-height: 44px;"));
  assert.ok(shareActionRule.includes("background: transparent;"));
  assert.ok(
    shareActionRule.includes(
      "border-bottom: 1px solid var(--journal-track-rule);"
    )
  );
  assert.ok(!shareActionRule.includes("border: 1px solid"));
  assert.ok(
    styles.includes(
      ".line-breaks-article .line-breaks-closing-share .journal-share-status {"
    )
  );
  assert.ok(styles.includes("min-height: 1.2em;"));
  assert.strictEqual(
    (html.match(/<button\b[^>]*data-journal-share\b/g) || []).length,
    1
  );
  assert.ok(
    html.includes(
      'data-share-native-event="Journal Share | line-breaks-are-part-of-the-meaning | native"'
    )
  );
  assert.ok(
    html.includes(
      'data-share-copy-event="Journal Share | line-breaks-are-part-of-the-meaning | copy-link"'
    )
  );
  assert.ok(html.includes('data-journal-share-status role="status" aria-live="polite"'));
  assert.ok(html.includes("Worth passing along?"));
  assert.ok(html.includes("<span>Share article</span>"));
  assert.strictEqual(
    (html.match(/data-statkit-event="Journal Related \| line-breaks-are-part-of-the-meaning \|/g) || []).length,
    4
  );
  assert.ok(
    /<article class="journal-track line-breaks-related-featured" data-related-continuation="featured">[\s\S]*?Directness Without False Certainty[\s\S]*?<\/article>/.test(
      html
    )
  );
  assert.strictEqual(
    (html.match(/data-related-continuation="supporting"/g) || []).length,
    2
  );
  assert.ok(html.includes('class="line-breaks-related-supporting"'));
  [
    "directness-without-false-certainty",
    "clearer-is-not-more-certain",
    "ssml-catalog-chunks"
  ].forEach((slug) => {
    assert.strictEqual(
      (
        html.match(
          new RegExp(
            `data-statkit-event="Journal Related \\| line-breaks-are-part-of-the-meaning \\| ${slug}"`,
            "g"
          )
        ) || []
      ).length,
      1
    );
  });

  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/g)].map(
    (match) => Number(match[1])
  );
  assert.strictEqual(headings[0], 1);
  headings.slice(1).forEach((level, index) => {
    assert.ok(
      level <= headings[index] + 1,
      `Article heading order jumps from h${headings[index]} to h${level}`
    );
  });
  const executableScripts = [...html.matchAll(/<script(?:\s[^>]*)?src="([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.deepStrictEqual(executableScripts, [
    "js/analytics-loader.js",
    "js/themes.js",
    "journal-share.js",
    "js/editorial-components.js"
  ]);

  assert.strictEqual(demo.status, "verified");
  assert.strictEqual(demo.destinations.length, 1);
  assert.deepStrictEqual(demo.destinations[0], {
    surface: "journal",
    file: articleFile,
    rootSelector: '[data-demo-id="DEMO-001"]'
  });
  assert.ok(
    !demo.destinations.some((destination) =>
      destination.file.includes("tests/fixtures")
    )
  );
  assert.deepStrictEqual(demo.rules, ["SD-STRUCTURE-001"]);
  assert.deepStrictEqual(demo.regressions, ["SecondDraft structure preservation"]);
  assert.deepStrictEqual(
    demo.comparison.versions.map((version) => version.engineCommit),
    ["6774224", "2d9454d"]
  );

  assert.ok(article);
  assert.strictEqual(article.file, articleFile);
  assert.strictEqual(article.canonical, canonical);
  assert.strictEqual(article.track, "engine-room");
  assert.strictEqual(article.published, "2026-07-29");
  assert.strictEqual(article.modified, "2026-08-03");
  assert.strictEqual(article.status, "published");
  assert.deepStrictEqual(article.primaryCta, {
    destination: "second-draft",
    href: "second-draft.html",
    event: "Journal CTA | line-breaks-are-part-of-the-meaning | second-draft"
  });
  assert.deepStrictEqual(article.related, [
    "directness-without-false-certainty",
    "clearer-is-not-more-certain",
    "ssml-catalog-chunks"
  ]);
  assert.deepStrictEqual(article.sources, []);
  assert.deepStrictEqual(article.engineCommits, ["6774224", "2d9454d"]);
  assert.deepStrictEqual(article.ruleIds, ["SD-STRUCTURE-001"]);
  assert.deepStrictEqual(article.knowledgeIds, []);

  const journalEvents = [
    article.analytics.open,
    ...article.analytics.cta,
    ...article.analytics.related,
    ...article.analytics.media,
    ...article.analytics.share
  ];
  assert.deepStrictEqual(journalEvents, [
    "Journal Open | line-breaks-are-part-of-the-meaning",
    "Journal CTA | line-breaks-are-part-of-the-meaning | second-draft",
    "Journal Related | line-breaks-are-part-of-the-meaning | directness-without-false-certainty",
    "Journal Related | line-breaks-are-part-of-the-meaning | clearer-is-not-more-certain",
    "Journal Related | line-breaks-are-part-of-the-meaning | ssml-catalog-chunks",
    "Journal Related | line-breaks-are-part-of-the-meaning | record-behind-product-transparency",
    "Journal Share | line-breaks-are-part-of-the-meaning | native",
    "Journal Share | line-breaks-are-part-of-the-meaning | copy-link"
  ]);
  journalEvents.forEach((event) => {
    assert.ok(!event.includes("?"));
    assert.ok(!event.includes("Calendar feeds"));
    assert.ok(!event.includes("Happy to schedule"));
  });
  assert.deepStrictEqual(demo.analytics, [
    "Editorial Demo | DEMO-001 | replay-start",
    "Editorial Demo | DEMO-001 | replay-complete",
    "Editorial Demo | DEMO-001 | replay-step",
    "Editorial Demo | DEMO-001 | compare-toggle",
    "Editorial Demo | DEMO-001 | metadata-open",
    "Editorial Demo | DEMO-001 | reset"
  ]);

  assert.strictEqual(
    (
      indexHtml.match(
        /href="journal-engine-room-line-breaks-are-part-of-the-meaning\.html"/g
      ) || []
    ).length,
    1
  );
  assert.ok(
    indexHtml.includes(
      'data-statkit-event="Journal Open | line-breaks-are-part-of-the-meaning"'
    )
  );
  assert.ok(
    indexHtml.indexOf(articleFile) <
      indexHtml.indexOf("journal-engine-room-directness-without-false-certainty.html")
  );
  assert.strictEqual((sitemap.match(new RegExp(canonical, "g")) || []).length, 1);
  assert.ok(!sitemap.includes("editorial-components-demo-001.html"));
}

function testEditorialKnowledgeGraphPublication() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "journal-manifest.json"), "utf8")
  );
  const article = manifest.articles.find(
    (item) => item.slug === "record-behind-product-transparency"
  );
  const html = fs.readFileSync(path.join(ROOT, article.file), "utf8");
  const indexHtml = fs.readFileSync(
    path.join(ROOT, "text-preparation-journal.html"),
    "utf8"
  );
  const feed = fs.readFileSync(path.join(ROOT, "journal.xml"), "utf8");

  assert.ok(article);
  assert.strictEqual(article.track, "editors-desk");
  assert.strictEqual(article.published, "2026-08-03");
  assert.strictEqual(article.modified, "2026-08-03");
  assert.deepStrictEqual(
    article.knowledgeGraph.continueTheRecord.map((edge) => edge.articleId),
    [
      "directness-without-false-certainty",
      "line-breaks-are-part-of-the-meaning",
      "tutor-not-ghostwriter"
    ]
  );
  assert.deepStrictEqual(article.knowledgeGraph.relatedPrinciples, [
    "evidence-before-narrative",
    "meaning-preservation",
    "verification-before-publication",
    "editorial-transparency"
  ]);
  assert.deepStrictEqual(article.knowledgeGraph.sourceMaterial, [
    "workflow-v2",
    "editorial-constitution"
  ]);
  assert.deepStrictEqual(
    manifest.principles.map((principle) => principle.id),
    [
      "evidence-before-narrative",
      "meaning-preservation",
      "verification-before-publication",
      "editorial-transparency"
    ]
  );
  assert.deepStrictEqual(
    manifest.sourceMaterials.map((source) => source.id),
    ["workflow-v2", "editorial-constitution"]
  );
  assert.ok(html.includes("The record is not a polished account"));
  assert.ok(html.includes("No single investigation establishes trust."));
  assert.ok(html.includes("Software changes. Can anyone later understand why?"));
  assert.strictEqual((html.match(/data-knowledge-graph/g) || []).length, 1);
  assert.strictEqual(
    (html.match(/data-relationship-article=/g) || []).length,
    3
  );
  assert.ok(
    indexHtml.indexOf(article.file) <
      indexHtml.indexOf("journal-sources-case-studies-tutor-not-ghostwriter.html")
  );
  assert.ok(
    feed.indexOf(article.canonical) <
      feed.indexOf(
        "https://guyt1225.github.io/pastelint/journal-sources-case-studies-tutor-not-ghostwriter.html"
      )
  );

  for (const slug of [
    "directness-without-false-certainty",
    "line-breaks-are-part-of-the-meaning",
    "tutor-not-ghostwriter"
  ]) {
    const participant = manifest.articles.find((item) => item.slug === slug);
    const participantHtml = fs.readFileSync(
      path.join(ROOT, participant.file),
      "utf8"
    );
    assert.ok(
      participant.knowledgeGraph.continueTheRecord.some(
        (edge) => edge.articleId === article.slug
      )
    );
    assert.ok(
      participantHtml.includes(
        'data-relationship-article="record-behind-product-transparency"'
      )
    );
  }
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

function testSecondDraftNotificationFrameSafety() {
  const context = loadSecondDraftContext();
  const options = {
    tone: "natural",
    length: "same",
    reflow: false
  };
  const forbiddenFragments = [
    "writing to the revised",
    "wanted to the schedule",
    "reaching out to recording",
    "writing to approval"
  ];

  const confirmed = context.reviseSecondDraft(
    "We are writing to let you know that the revised menu is ready for review.",
    options
  );
  assert.strictEqual(confirmed.text, "The revised menu is ready for review.");
  assert.strictEqual(confirmed.edits[0].before, "We are writing to let you know that the revised menu is ready for review.");
  assert.strictEqual(confirmed.edits[0].after, "The revised menu is ready for review.");
  assert.strictEqual(confirmed.edits[0].ruleId, "SD-CLARITY-001");

  const firstPerson = context.reviseSecondDraft(
    "I wanted to let you know that the schedule changed.",
    options
  );
  assert.strictEqual(firstPerson.text, "The schedule changed.");

  const reachingOut = context.reviseSecondDraft(
    "We are reaching out to let you know that recording begins after approval.",
    options
  );
  assert.strictEqual(reachingOut.text, "Recording begins after approval.");

  const negation = context.reviseSecondDraft(
    "I wanted to let you know that recording will not begin before approval.",
    options
  );
  assert.strictEqual(negation.text, "Recording will not begin before approval.");
  assert.ok(negation.text.includes("not"));
  assert.ok(negation.text.includes("before approval"));

  const protectedValues = context.reviseSecondDraft(
    "We are writing to let you know that approval is due by Tuesday, July 28. Send questions to support@example.com or call 914-555-0184.",
    options
  );
  assert.strictEqual(
    protectedValues.text,
    "Approval is due by Tuesday, July 28. Send questions to support@example.com or call 914-555-0184."
  );
  assert.ok(protectedValues.text.includes("Tuesday, July 28"));
  assert.ok(protectedValues.text.includes("support@example.com"));
  assert.ok(protectedValues.text.includes("914-555-0184"));

  const url = context.reviseSecondDraft(
    "We wanted to let you know that the approved page is https://example.com/library-menu.",
    options
  );
  assert.strictEqual(url.text, "The approved page is https://example.com/library-menu.");
  assert.ok(url.text.includes("https://example.com/library-menu"));

  const ambiguousObject = context.reviseSecondDraft(
    "We wanted to let you know that your request was received, but it has not yet been approved.",
    options
  );
  assert.strictEqual(
    ambiguousObject.text,
    "Your request was received, but it has not yet been approved."
  );
  assert.ok(ambiguousObject.text.includes("but"));
  assert.ok(ambiguousObject.text.includes("not yet been approved"));

  const alreadyClean = context.reviseSecondDraft(
    "The revised menu is ready for review.",
    options
  );
  assert.strictEqual(alreadyClean.text, "The revised menu is ready for review.");
  assert.deepStrictEqual(Array.from(alreadyClean.edits), []);
  assert.deepStrictEqual(Array.from(alreadyClean.changes), [
    "No major revision needed. The text already reads cleanly."
  ]);

  const nonTarget = context.reviseSecondDraft(
    "Please let your supervisor know that the menu was approved.",
    options
  );
  assert.strictEqual(nonTarget.text, "Please let your supervisor know that the menu was approved.");
  assert.deepStrictEqual(Array.from(nonTarget.edits), []);

  const quoted = context.reviseSecondDraft(
    "The script says, \"We wanted to let you know that service is delayed.\"",
    options
  );
  assert.ok(quoted.text.includes("We wanted to let you know that service is delayed"));
  assert.ok(!quoted.edits.some((edit) => edit.before.includes("We wanted to let you know")));

  const paragraphs = context.reviseSecondDraft(
    [
      "We are writing to let you know that the revised menu is ready for review.",
      "",
      "I wanted to let you know that the schedule changed."
    ].join("\n"),
    options
  );
  assert.strictEqual(
    paragraphs.text,
    ["The revised menu is ready for review.", "", "The schedule changed."].join("\n")
  );
  assert.ok(paragraphs.text.includes("\n\n"));

  const direct = context.reviseSecondDraft(
    "We are writing to let you know that the revised menu is ready for review.",
    {
      tone: "direct",
      length: "same",
      reflow: false
    }
  );
  assert.strictEqual(direct.text, "The revised menu is ready for review.");

  [
    confirmed,
    firstPerson,
    reachingOut,
    negation,
    protectedValues,
    url,
    ambiguousObject,
    nonTarget,
    paragraphs,
    direct
  ].forEach((result) => {
    forbiddenFragments.forEach((fragment) => {
      assert.ok(!result.text.includes(fragment), `Unexpected malformed fragment: ${fragment}`);
    });
    assert.ok(!result.edits.some((edit) => String(edit.after).includes("writing to the revised")));
    assert.ok(!result.edits.some((edit) => String(edit.after).includes("wanted to the schedule")));
  });
}

function testSecondDraftPrepareForSsmlTransfer() {
  const storage = {};
  const context = loadSecondDraftContext({ storage });
  const fixture = [
    "The revised library phone menu is ready for final review.",
    "",
    "Please confirm the event dates, department names, phone numbers, and menu options. Send approval to support@example.com by Tuesday, July 28.",
    "",
    "Recording begins at 5:00 p.m. only after approval. Questions may be discussed by calling 914-555-0184.",
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
  assert.ok(storage["pastelint-transfer-text"].includes("5:00 p.m."));
  assert.ok(storage["pastelint-transfer-text"].includes("https://example.com/library-menu"));
  assert.ok(
    storage["pastelint-transfer-text"].includes(
      "Recording begins at 5:00 p.m. only after approval"
    )
  );
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
    "Recording begins at 5:00 p.m. only after approval. Questions may be discussed by calling 914-555-0184.",
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
  assert.ok(input.value.includes("5:00 p.m."));
  assert.ok(input.value.includes("https://example.com/library-menu"));
  assert.ok(
    input.value.includes("Recording begins at 5:00 p.m. only after approval")
  );
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
    "Approved recording time remains 5:00 p.m.",
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
  assert.ok(output.includes("5:00 p.m."));
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
  assert.strictEqual(elements.ssmlStatus.textContent, "Add text to clean.");
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "blocked");
  assert.strictEqual(elements.cleanOutput.value, "");

  elements.input.value = "   \n\t   ";
  elements.cleanOutput.value = "Previous cleaned text.";
  context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Add text to clean.");
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "blocked");
  assert.strictEqual(elements.cleanOutput.value, "");

  elements.input.value = "Welcome to the library.";
  const cleaned = context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "No speech cleanup needed. The text was preserved.");
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "unchanged");
  assert.ok(cleaned.includes("Welcome to the library."));
  assert.ok(elements.cleanOutput.value.includes("Welcome to the library."));

  elements.input.value = "";
  elements.cleanOutput.value = "";
  elements.footerType.value = "calendar";
  const footerCleaned = context.cleanOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Speech text cleaned. Review it before generating SSML.");
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "changed");
  assert.ok(footerCleaned.includes("To go back to the previous section, press 4."));
  assert.ok(elements.cleanOutput.value.includes("To go back to the previous section, press 4."));

  elements.footerType.value = "none";
  elements.input.value = "";
  elements.cleanOutput.value = "";
  elements.ssmlOutput.value = "";

  context.generateSsmlOnly();
  assert.strictEqual(elements.ssmlStatus.textContent, "Add text before generating SSML.");
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "blocked");

  elements.input.value = "Welcome to the library.";
  context.generateSsmlOnly();
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "changed");
  assert.ok(elements.ssmlOutput.value.includes("<speak>"));

  context.generateSsmlOnly();
  assert.strictEqual(elements.ssmlStatus.dataset.feedbackState, "unchanged");
  assert.strictEqual(
    elements.ssmlStatus.textContent,
    "SSML already matches the available text."
  );

  elements.input.value = "";
  elements.cleanOutput.value = "";
  elements.ssmlOutput.value = "";
  context.speakTextById("cleanOutput");
  assert.strictEqual(elements.ssmlStatus.textContent, "Nothing to read yet.");

  context.exportChunksZip();
  assert.strictEqual(elements.ssmlStatus.textContent, "Nothing to export yet.");
}

function main() {
  runTest("Hidden characters", testCleanEngineHiddenCharacters);
  runTest("Feedback state foundation", testFeedbackStateFoundation);
  runTest("Homepage hidden-character smoke case", testHomepageHiddenCharacterSmokeCase);
  runTest("Homepage empty input status", testHomepageEmptyInputStatus);
  runTest("Hidden-character page structure", testScriptHiddenPageStructure);
  runTest("PDF paste reflow", testScriptPdfPostProcessing);
  runTest("SecondDraft rewrites", testSecondDraftRewrites);
  runTest("SecondDraft feedback states", testSecondDraftFeedbackStates);
  runTest("SecondDraft Direct request differentiation", testSecondDraftDirectRequestDifferentiation);
  runTest("SecondDraft Direct modality preservation", testSecondDraftDirectModalityPreservation);
  runTest("SecondDraft strength preservation", testSecondDraftStrengthPreservation);
  runTest("SecondDraft Shorter redundancy reduction", testSecondDraftShorterRedundancyReduction);
  runTest("SecondDraft time abbreviation preservation", testSecondDraftTimeAbbreviationPreservation);
  runTest("SecondDraft rule registry", testSecondDraftRuleRegistry);
  runTest("SecondDraft rule metadata preserves output", testSecondDraftRuleMetadataPreservesOutput);
  runTest("SecondDraft Professional tone safety reset", testSecondDraftProfessionalToneSafetyReset);
  runTest("SecondDraft paragraph reflow truthfulness", testSecondDraftParagraphReflowTruthfulness);
  runTest("SecondDraft structure preservation", testSecondDraftStructurePreservation);
  runTest("Editorial Components foundation", testEditorialComponentsFoundation);
  runTest("Line breaks article publication", testLineBreaksArticlePublication);
  runTest("Editorial Knowledge Graph publication", testEditorialKnowledgeGraphPublication);
  runTest("SecondDraft primary reflow preserves protected values", testSecondDraftPrimaryReflowPreservesProtectedValues);
  runTest("SecondDraft notification frame safety", testSecondDraftNotificationFrameSafety);
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
