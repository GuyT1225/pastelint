"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const operationsModule = require("../js/analytics-operation-instrumentation.js");

const ROOT = path.resolve(__dirname, "..");
const VALID_EVENTS = new Set(["tool_start", "tool_complete", "output_copy"]);

function loadScript(relativePath, context) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

function element(value = "") {
  const classes = new Set();
  return {
    value,
    dataset: {},
    textContent: "",
    innerHTML: "",
    hidden: false,
    style: {},
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
      toggle(name, active) {
        if (active) classes.add(name);
        else classes.delete(name);
      }
    },
    addEventListener() {},
    appendChild() {},
    querySelectorAll() { return []; },
    setAttribute() {},
    removeAttribute() {},
    dispatchEvent() {},
    scrollIntoView() {},
    select() {},
    remove() {},
    focus() {}
  };
}

function createOperations(events, mode = "enabled") {
  if (mode === "missing") return undefined;
  if (mode === "throwing-adapter") {
    return {
      beginOperation() { throw new Error("adapter unavailable"); },
      recordCopy() { throw new Error("adapter unavailable"); }
    };
  }
  if (mode === "throwing-completion") {
    return {
      beginOperation() {
        return { complete() { throw new Error("completion unavailable"); } };
      },
      recordCopy() { throw new Error("copy unavailable"); }
    };
  }

  return operationsModule.create({
    dispatch(...args) {
      if (mode === "disabled") return false;
      if (mode === "throwing-dispatcher") throw new Error("dispatcher unavailable");
      events.push(args);
      return true;
    }
  });
}

function createContext({ elements = {}, events = [], mode, copy = "success" } = {}) {
  const operations = createOperations(events, mode);
  const temporary = element();
  const document = {
    activeElement: element(),
    addEventListener() {},
    getElementById(id) {
      return Object.prototype.hasOwnProperty.call(elements, id) ? elements[id] : null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return temporary; },
    execCommand() { return copy === "success"; },
    body: {
      classList: {
        contains() { return false; },
        toggle() {}
      },
      appendChild() {}
    }
  };
  const window = {
    isSecureContext: true,
    PasteLintAnalyticsOperations: operations,
    speechSynthesis: { cancel() {}, speak() {} }
  };
  const context = vm.createContext({
    console,
    document,
    window,
    navigator: {
      clipboard: {
        async writeText() {
          if (copy !== "success") throw new Error("clipboard denied");
        }
      }
    },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    Event: function Event(type) { this.type = type; },
    Blob: function Blob() {},
    URL: { createObjectURL() { return "blob:stub"; }, revokeObjectURL() {} },
    SpeechSynthesisUtterance: function Speech(text) { this.text = text; },
    setTimeout(callback) { if (callback) callback(); return 0; },
    clearTimeout() {}
  });
  window.window = window;
  window.document = document;
  window.navigator = context.navigator;
  return context;
}

function loadCleanContext(options = {}) {
  const { includeUtils = true, ...contextOptions } = options;
  const context = createContext(contextOptions);
  loadScript("js/text-analyzer.js", context);
  loadScript("js/text-clean-engine.js", context);
  if (includeUtils) loadScript("js/utils.js", context);
  loadScript("js/feedback-state.js", context);
  loadScript("js/script.js", context);
  return context;
}

function loadSecondDraftContext(options = {}) {
  const context = createContext(options);
  loadScript("js/utils.js", context);
  loadScript("js/feedback-state.js", context);
  loadScript("js/second-draft.js", context);
  return context;
}

function ssmlElements(overrides = {}) {
  return {
    input: element(),
    cleanOutput: element(),
    ssmlOutput: element(),
    ssmlStatus: element(),
    inputCounter: element(),
    cleanCounter: element(),
    ssmlCounter: element(),
    inputWarning: element(),
    cleanWarning: element(),
    ssmlWarning: element(),
    cleanGenerateBtn: element(),
    autoChunkBtn: element(),
    sectionTitle: element(),
    footerType: element("none"),
    previewMode: element("plain"),
    chunksContainer: element(),
    chunkSummary: element(),
    chunkStart: element(),
    ...overrides
  };
}

function loadSsmlContext(options = {}) {
  const elements = options.elements || ssmlElements();
  const context = createContext({ ...options, elements });
  loadScript("js/utils.js", context);
  loadScript("js/feedback-state.js", context);
  loadScript("js/ssml-builder.js", context);
  return { context, elements };
}

function cleanElements(value = "") {
  return {
    input: element(value),
    output: element(),
    cleanMode: element("standard"),
    viewMode: element("paragraph"),
    toolStatus: element(),
    postCleanActions: element()
  };
}

function draftElements(value = "") {
  return {
    input: element(value),
    output: element(),
    outputPanel: element(),
    toneSelect: element("natural"),
    lengthSelect: element("same"),
    reflowToggle: { ...element(), checked: false },
    toolStatus: element(),
    qualityHint: element(),
    changeInsightEmpty: element(),
    changeInsightList: element(),
    editMapEmpty: element(),
    editMapList: element(),
    inputCharCount: element(),
    inputWordCount: element(),
    outputCharCount: element(),
    outputWordCount: element()
  };
}

function eventTypes(events) {
  return events.map((args) => args[0]);
}

function assertPrivateEventArguments(events, forbiddenText) {
  for (const args of events) {
    assert.equal(args.length, 1);
    assert.equal(VALID_EVENTS.has(args[0]), true);
    assert.equal(JSON.stringify(args).includes(forbiddenText), false);
  }
}

test("operation adapter gives each action one start and at most one completion", () => {
  const events = [];
  const operations = createOperations(events);
  const first = operations.beginOperation();
  assert.equal(first.complete(), true);
  assert.equal(first.complete(), false);
  const second = operations.beginOperation();
  assert.equal(second.complete(), true);
  operations.recordCopy();
  assert.deepEqual(eventTypes(events), [
    "tool_start", "tool_complete", "tool_start", "tool_complete", "output_copy"
  ]);
});

test("browser operation adapter is frozen, immutable and sinkless", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "js", "analytics-operation-instrumentation.js"),
    "utf8"
  );
  const context = vm.createContext({ Object });
  vm.runInContext(source, context, { filename: "js/analytics-operation-instrumentation.js" });
  const adapter = context.PasteLintAnalyticsOperations;
  assert.equal(Object.isFrozen(adapter), true);
  assert.equal(Object.getOwnPropertyDescriptor(context, "PasteLintAnalyticsOperations").writable, false);
  assert.doesNotThrow(() => adapter.beginOperation().complete());
  assert.equal(adapter.recordCopy(), false);
});

test("PasteLint Clean emits only for valid starts and usable completions", () => {
  const events = [];
  const context = loadCleanContext({ events });

  context.handleClean(cleanElements("   "));
  assert.deepEqual(events, []);

  const changed = cleanElements("Text with    extra spacing.");
  context.handleClean(changed);
  assert.ok(changed.output.value.trim());

  const unchanged = cleanElements("This text is already clean.");
  context.handleClean(unchanged);
  assert.equal(unchanged.output.value, unchanged.input.value);
  assert.deepEqual(eventTypes(events), [
    "tool_start", "tool_complete", "tool_start", "tool_complete"
  ]);

  const failedEvents = [];
  const failedContext = loadCleanContext({ events: failedEvents });
  failedContext.getCleanResult = () => { throw new Error("processing failed"); };
  failedContext.handleClean(cleanElements("Valid private source text."));
  assert.deepEqual(eventTypes(failedEvents), ["tool_start"]);
  assertPrivateEventArguments(events.concat(failedEvents), "private source");
});

test("PasteLint Clean copies emit only after confirmed clipboard success", async () => {
  const successEvents = [];
  const successContext = loadCleanContext({ events: successEvents });
  const output = cleanElements();
  output.output.value = "private clean output";
  assert.equal(await successContext.copyOutput(output), true);
  assert.equal(await successContext.copyOutput(output), true);
  assert.deepEqual(eventTypes(successEvents), ["output_copy", "output_copy"]);

  const failedEvents = [];
  const failedContext = loadCleanContext({ events: failedEvents, copy: "failed" });
  assert.equal(await failedContext.copyOutput(output), false);
  output.output.value = "";
  assert.equal(await failedContext.copyOutput(output), false);
  assert.deepEqual(failedEvents, []);
  assertPrivateEventArguments(successEvents, "private clean output");
});

test("SecondDraft revision and analysis brief use trustworthy success boundaries", () => {
  const events = [];
  const context = loadSecondDraftContext({ events });
  context.handleSecondDraftRevise(draftElements(""));

  const unchanged = draftElements("The revised menu is ready for review.");
  context.handleSecondDraftRevise(unchanged);
  assert.equal(unchanged.output.value, unchanged.input.value);

  const changed = draftElements("I wanted to mention that the schedule changed.");
  context.handleSecondDraftRevise(changed);
  assert.ok(changed.output.value.trim());

  context.reviseSecondDraft = () => ({ text: ", unsafe result", changes: [], edits: [] });
  context.handleSecondDraftRevise(draftElements("Trustworthy private source."));

  context.handleBuildAnalysisBrief(draftElements("Private evidence for analysis."));
  assert.deepEqual(eventTypes(events), [
    "tool_start", "tool_complete",
    "tool_start", "tool_complete",
    "tool_start",
    "tool_start", "tool_complete"
  ]);
  assertPrivateEventArguments(events, "Private evidence");
});

test("SecondDraft copies emit once per successful action", async () => {
  const successEvents = [];
  const successContext = loadSecondDraftContext({ events: successEvents });
  const els = draftElements();
  els.output.value = "private revised output";
  assert.equal(await successContext.copySecondDraftOutput(els), true);
  assert.equal(await successContext.copySecondDraftOutput(els), true);
  assert.deepEqual(eventTypes(successEvents), ["output_copy", "output_copy"]);

  const failedEvents = [];
  const failedContext = loadSecondDraftContext({ events: failedEvents, copy: "failed" });
  assert.equal(await failedContext.copySecondDraftOutput(els), false);
  els.output.value = "";
  assert.equal(await failedContext.copySecondDraftOutput(els), false);
  assert.deepEqual(failedEvents, []);
});

test("SSML explicit processing actions each own exactly one lifecycle pair", () => {
  const cases = [
    ["clean only", (context) => context.cleanOnly(), { input: "Clean this narration." }],
    ["generate only", (context) => context.generateSsmlOnly(), { input: "Generate this narration." }],
    ["generate cleaned", (context) => context.generateSsmlFromCleanedText(), { cleanOutput: "Prepared narration." }],
    ["combined", (context) => context.cleanAndGenerate(), { input: "Clean and generate this narration." }],
    ["explicit chunks", (context) => context.generateChunks(false), { input: "Create explicit chunks for this narration." }],
    ["redirected chunks", (context) => context.cleanAndGenerate(), { input: "Sentence. ".repeat(420) }]
  ];

  for (const [name, action, values] of cases) {
    const events = [];
    const elements = ssmlElements();
    Object.entries(values).forEach(([id, value]) => { elements[id].value = value; });
    const { context } = loadSsmlContext({ elements, events });
    const result = action(context);
    assert.notEqual(result, false, name);
    assert.deepEqual(eventTypes(events), ["tool_start", "tool_complete"], name);
  }
});

test("SSML failures and empty chunking never produce false completions", () => {
  const emptyEvents = [];
  const empty = loadSsmlContext({ elements: ssmlElements(), events: emptyEvents });
  empty.context.cleanOnly();
  empty.context.generateSsmlOnly();
  empty.context.generateSsmlFromCleanedText();
  empty.context.cleanAndGenerate();
  empty.context.generateChunks(false);
  assert.deepEqual(emptyEvents, []);

  const partialEvents = [];
  const partialElements = ssmlElements({ input: element("Valid combined source.") });
  const partial = loadSsmlContext({ elements: partialElements, events: partialEvents });
  partial.context.generateSsmlFromText = () => "failed";
  assert.equal(partial.context.cleanAndGenerate(), "failed");
  assert.deepEqual(eventTypes(partialEvents), ["tool_start"]);

  const failedChunkEvents = [];
  const failedChunkElements = ssmlElements({ input: element("Valid chunk source.") });
  const failedChunk = loadSsmlContext({ elements: failedChunkElements, events: failedChunkEvents });
  failedChunk.context.buildFullCleanText = () => { throw new Error("chunk failure"); };
  assert.throws(() => failedChunk.context.generateChunks(false), /chunk failure/);
  assert.deepEqual(eventTypes(failedChunkEvents), ["tool_start"]);
});

test("SSML cleaned, full and chunk copies count successful actions only", async () => {
  const events = [];
  const elements = ssmlElements({
    cleanOutput: element("private cleaned text"),
    ssmlOutput: element("<speak>private ssml</speak>"),
    chunkText0: element("private chunk text"),
    chunkSSML0: element("<speak>private chunk ssml</speak>"),
    emptyChunk: element("")
  });
  const success = loadSsmlContext({ elements, events });
  for (const id of ["cleanOutput", "ssmlOutput", "chunkText0", "chunkSSML0", "chunkText0"]) {
    assert.equal(await success.context.copyText(id), true);
  }
  assert.deepEqual(eventTypes(events), Array(5).fill("output_copy"));
  assertPrivateEventArguments(events, "private chunk");

  const failedEvents = [];
  const failed = loadSsmlContext({ elements, events: failedEvents, copy: "failed" });
  assert.equal(await failed.context.copyText("chunkText0"), false);
  assert.equal(await failed.context.copyText("emptyChunk"), false);
  assert.equal(await failed.context.copyText("missing"), false);
  assert.deepEqual(failedEvents, []);
});

test("missing, disabled and throwing analytics never alter tool outcomes", async () => {
  for (const mode of ["missing", "disabled", "throwing-adapter", "throwing-dispatcher", "throwing-completion"]) {
    const events = [];
    const context = loadCleanContext({ events, mode });
    const els = cleanElements("Valid text remains usable.");
    assert.doesNotThrow(() => context.handleClean(els), mode);
    assert.ok(els.output.value.trim(), mode);
    assert.deepEqual(events, [], mode);

    els.output.value = "Copy remains usable.";
    assert.equal(await context.copyOutput(els), true, mode);
    assert.deepEqual(events, [], mode);
  }
});

test("shared Clean handler remains usable when analytics utilities are not loaded", () => {
  const context = loadCleanContext({ includeUtils: false });
  const els = cleanElements("Valid shared-page text remains usable.");
  assert.doesNotThrow(() => context.handleClean(els));
  assert.ok(els.output.value.trim());
});

test("public integration stays inactive, private sync stays explicit and no transport is added", () => {
  const adapterSource = fs.readFileSync(
    path.join(ROOT, "js", "analytics-operation-instrumentation.js"),
    "utf8"
  );
  for (const forbidden of ["fetch(", "sendBeacon", "XMLHttpRequest", "WebSocket", "workers.dev"]) {
    assert.equal(adapterSource.includes(forbidden), false, forbidden);
  }

  for (const file of ["index.html", "second-draft.html", "SSML_builder.html"]) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.equal(html.includes("js/analytics-operation-instrumentation.js"), false, file);
    assert.equal(html.includes("js/analytics-event-dispatcher.js"), false, file);
  }

  assert.equal(fs.existsSync(path.join(ROOT, "tests", "analytics-contract-sync.test.mjs")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "scripts", "analytics-contract-sync.mjs")), true);
});
