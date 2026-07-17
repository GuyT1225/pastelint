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
  runTest("SSML cleanup", testSsmlCleanup);
  runTest("SSML IVR menu cleanup", testSsmlIvrMenuCleanup);
  runTest("SSML XML escaping", testSsmlXmlEscaping);
  runTest("SSML generate from cleaned text", testSsmlGenerateFromCleanedText);
  runTest("SSML approved cleaned text preservation", testSsmlApprovedCleanedTextPreservation);
  runTest("SSML chunking safety", testSsmlChunkingSafety);
  runTest("SSML large OTBS script cleanup", testSsmlLargeOtbsScriptCleanup);
  runTest("SSML empty action statuses", testSsmlEmptyActionStatuses);

  console.log("All regression checks passed.");
}

main();
