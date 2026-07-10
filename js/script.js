document.addEventListener("DOMContentLoaded", () => {
  const els = getElements();

  bindEvents(els);
  updateCounters(els);
  runPreAnalysis(els);
});

/* -----------------------------
   ELEMENTS - PASTELINT
----------------------------- */

function $(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }

  return null;
}

function getElements() {
  return {
    input: $("inputText", "cleanInput", "input"),
    output: $("cleanOutput", "outputText", "output"),

    cleanBtn: $("cleanBtn"),
    copyBtn: $("copyBtn"),
    clearBtn: $("clearBtn"),

    inputCharCount: $("inputCharCount"),
    inputWordCount: $("inputWordCount"),
    outputCharCount: $("outputCharCount"),
    outputWordCount: $("outputWordCount"),

    cleanMode: $("cleanMode", "modeToggle"),
    viewMode: $("viewMode"),

    issuePanel: $("analysisList", "foundList"),
    textBrief: $("textBrief"),
    impactPanel: $("impactList"),
    changeSummary: $("improvementList"),
    changePreview: $("changePreview"),
    editMap: $("editMap"),
    visualPreview: $("visualPreview"),
    postCleanActions: $("postCleanActions"),
    toolStatus: $("toolStatus")
  };
}

/* -----------------------------
   EVENTS - PASTELINT
----------------------------- */

function bindEvents(els) {
  if (!els.input && !els.output) return;

  els.input?.addEventListener("input", () => {
    updateCounters(els);
    runPreAnalysis(els);
  });

  els.cleanBtn?.addEventListener("click", () => handleClean(els));
  els.copyBtn?.addEventListener("click", () => copyOutput(els));
  els.clearBtn?.addEventListener("click", () => clearAll(els));
}

/* -----------------------------
   SAFE TYPO SUPPORT
----------------------------- */

const COMMON_TYPOS = {
  teh: "the",
  adn: "and",
  recieve: "receive",
  recieved: "received",
  recieving: "receiving",
  seperate: "separate",
  definately: "definitely",
  occured: "occurred",
  occuring: "occurring",
  untill: "until",
  becuase: "because",
  taht: "that",
  wich: "which",
  thier: "their",
  beleive: "believe",
  acheive: "achieve",
  accomodate: "accommodate",
  adress: "address",
  enviroment: "environment",
  goverment: "government",
  calender: "calendar",
  tommorow: "tomorrow",
  yesturday: "yesterday",
  alot: "a lot"
};

function fixCommonTypos(text) {
  let count = 0;
  const edits = [];

  const fixed = String(text).replace(/\b[A-Za-z']+\b/g, word => {
    const lower = word.toLowerCase();
    const replacement = COMMON_TYPOS[lower];

    if (!replacement) return word;

    count++;

    let finalReplacement = replacement;

    if (word === word.toUpperCase()) {
      finalReplacement = replacement.toUpperCase();
    } else if (word[0] === word[0].toUpperCase()) {
      finalReplacement = capitalize(replacement);
    }

    edits.push({
      type: "typo",
      before: word,
      after: finalReplacement
    });

    return finalReplacement;
  });

  return { text: fixed, count, edits };
}

function fixRepeatedWords(text) {
  let count = 0;
  const edits = [];

  const fixed = String(text).replace(/\b(\w+)\s+\1\b/gi, (match, word) => {
    count++;

    edits.push({
      type: "repeat",
      before: match,
      after: word
    });

    return word;
  });

  return { text: fixed, count, edits };
}

function capitalize(text) {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}

/* -----------------------------
   PRE-ANALYSIS
----------------------------- */

function runPreAnalysis(els, extraIssues = [], cleanedText = "") {
  const text = getInputText(els);

  if (!text) {
    renderEmptyIssues(els);
    return;
  }

  let issues = [];

  if (
    window.PasteLintAnalyzer &&
    typeof window.PasteLintAnalyzer.analyzeText === "function"
  ) {
    const analysis = window.PasteLintAnalyzer.analyzeText(text);

    const analyzerIssues = [
      ...(analysis.findings || []),
      ...(analysis.speechRisks || [])
    ]
      .filter(item => item && item.message)
      .map(item => ({
        type: item.type || "observation",
        severity: item.severity || "low",
        message: item.message,
        text: item.text || "",
        sourceText: text
      }));

    const localIssues = detectIssues(text).map(message => ({
      type: "local-observation",
      severity: "low",
      message,
      text: "",
      sourceText: text
    }));

    const engineIssues = normalizeEngineWarningsForIssues(
      extraIssues,
      text
    );

    issues = dedupeStructuredIssues([
      ...analyzerIssues,
      ...localIssues,
      ...engineIssues
    ]);
  } else {
    issues = dedupeStructuredIssues([
      ...detectIssues(text).map(message => ({
        type: "local-observation",
        severity: "low",
        message,
        text: "",
        sourceText: text
      })),
      ...normalizeEngineWarningsForIssues(extraIssues, text)
    ]);
  }

  if (cleanedText) {
    issues = filterResolvedWarnings(issues, cleanedText);
  }

  renderGroupedIssues(els, issues);
  renderDiagnosticsForPage(issues);
  renderSummary(issues);
}

function detectIssues(text) {
  const source = String(text || "");
  const issues = [];
  const sentences = source.split(/[.!?]/).filter(Boolean);

  if (sentences.some(sentence => sentence.trim().split(/\s+/).length > 25)) {
    issues.push("Some sentences are too long");
  }

  if (/(very|really|basically|actually)/i.test(source)) {
    issues.push("Contains filler words");
  }

  if (/\b(\w+)\s+\1\b/i.test(source)) {
    issues.push("Repeated words detected");
  }

  if (/(utilize|assistance|facilitate|leverage|delve|unlock potential|drive outcomes|seamless integration|tapestry)/i.test(source)) {
    issues.push("Overly formal wording");
  }

  return issues;
}

function normalizeEngineWarningsForIssues(warnings = [], sourceText = "") {
  if (!Array.isArray(warnings)) return [];

  return warnings
    .filter(warning => warning && warning.message)
    .map(warning => ({
      type: warning.type || "engine-warning",
      severity: warning.severity || "low",
      message: warning.message,
      text: warning.text || "",
      sourceText
    }));
}

function filterResolvedWarnings(warnings = [], cleanedText = "") {
  if (!Array.isArray(warnings)) return [];

  const text = String(cleanedText || "");

  return warnings.filter(warning => {
    if (!warning) return false;

    const type = String(warning.type || "").toLowerCase();
    const message = String(warning.message || "").toLowerCase();
    const warningText = String(warning.text || "").toLowerCase();

    const isAmpersand =
      type.includes("ampersand") ||
      message.includes("ampersand") ||
      warningText === "&";

    if (isAmpersand && !text.includes("&")) {
      return false;
    }

    const isAtSymbol =
      type.includes("at-symbol") ||
      message.includes("@ symbol") ||
      message.includes("at symbol") ||
      warningText === "@";

    if (isAtSymbol && !text.includes("@")) {
      return false;
    }

    const isDbNumber =
      type.includes("db") ||
      message.includes("db number") ||
      message.includes("compact db") ||
      warningText.includes("db number");

    if (isDbNumber && !/\bDB\s*[-:]?\s*\d{4,}\b/i.test(text)) {
      return false;
    }

    return true;
  });
}

function dedupeStructuredIssues(items) {
  const seen = new Set();
  const output = [];

  (items || []).forEach(item => {
    const message = String(item?.message || "").trim();
    if (!message) return;

    const key = getIssueKey(message);

    if (seen.has(key)) return;

    seen.add(key);
    output.push(item);
  });

  return output;
}

function renderEmptyIssues(els) {
  if (!els.issuePanel) return;

  els.issuePanel.innerHTML =
    "<li>Paste text to see a quick readability check.</li>";
}

function groupIssuesForDisplay(issues = []) {
  const groups = {
    formatting: {
      title: "Formatting fixes",
      items: []
    },

    readability: {
      title: "Readability risk",
      items: []
    },

    speech: {
      title: "Speech readiness",
      items: []
    },

    other: {
      title: "Other observations",
      items: []
    }
  };

  issues.forEach(issue => {
    const type =
      typeof issue === "string"
        ? ""
        : issue.type || "";

    const message =
      typeof issue === "string"
        ? issue.toLowerCase()
        : (issue.message || "").toLowerCase();

    if (
      type.includes("speech") ||
      type.includes("dash") ||
      type.includes("ampersand") ||
      message.includes("dash") ||
      message.includes("ampersand") ||
      message.includes("@ symbol") ||
      message.includes("at symbol") ||
      message.includes("db number") ||
      message.includes("compact db") ||
      message.includes("spoken output") ||
      message.includes("ssml") ||
      message.includes("ivr")
    ) {
      groups.speech.items.push(issue);
      return;
    }

    if (
      type.includes("spacing") ||
      type.includes("blank") ||
      message.includes("spacing") ||
      message.includes("blank")
    ) {
      groups.formatting.items.push(issue);
      return;
    }

    if (
      type.includes("sentence") ||
      type.includes("readability") ||
      message.includes("sentence") ||
      message.includes("filler") ||
      message.includes("formal")
    ) {
      groups.readability.items.push(issue);
      return;
    }

    groups.other.items.push(issue);
  });

  return groups;
}
function renderGroupedIssues(els, issues) {
  if (!els.issuePanel) return;

  const grouped = groupIssuesForDisplay(issues);
  const sections = [];

  if (grouped.formatting.items.length) {
    sections.push(renderIssueGroup(grouped.formatting));
  }

  if (grouped.readability.items.length) {
    sections.push(renderIssueGroup(grouped.readability));
  }

  if (grouped.speech.items.length) {
    sections.push(renderIssueGroup(grouped.speech));
  }

  if (grouped.other.items.length) {
    sections.push(renderIssueGroup(grouped.other));
  }

  els.issuePanel.innerHTML =
    sections.join("") ||
    "<p>No obvious issues detected.</p>";
}

function renderIssueGroup(group) {
  return `
    <div class="issue-group">
      <strong>${escapeHTML(group.title)}</strong>
      <div class="diagnostic-list">
        ${group.items
          .map(issue => renderDiagnosticItem(issue))
          .join("")}
      </div>
    </div>
  `;
}

function renderSummary(issues = []) {
  const panel =
    document.getElementById("summaryContent");

  if (!panel) return;

  const formatting =
    issues.filter(i =>
      String(i.type || "").includes("spacing") ||
      String(i.type || "").includes("blank")
    ).length;

  const readability =
    issues.filter(i =>
      String(i.message || "").match(
        /filler|formal|sentence|repeated/i
      )
    ).length;

  const speech =
    issues.filter(i =>
      String(i.type || "").match(
        /dash|ampersand|speech/i
      ) ||
      String(i.message || "").match(
        /@ symbol|at symbol|db number|compact db/i
      )
    ).length;

  const total = issues.length;

  panel.innerHTML = `
    <div class="summary-total">
      ${total} finding${total === 1 ? "" : "s"} detected
    </div>

    <ul class="summary-list">
      ${
        formatting
          ? `<li>${formatting} formatting issue${formatting > 1 ? "s" : ""}</li>`
          : ""
      }

      ${
        readability
          ? `<li>${readability} readability issue${readability > 1 ? "s" : ""}</li>`
          : ""
      }

      ${
        speech
          ? `<li>${speech} speech-readiness issue${speech > 1 ? "s" : ""}</li>`
          : ""
      }
    </ul>

    <div class="summary-result">
      Overall readability improved.
    </div>
  `;
}

function renderDiagnosticItem(issue) {
  const item = normalizeIssueForDisplay(issue);

  return `
    <div class="diagnostic-row">

      <div class="diagnostic-title">
        ${escapeHTML(item.label)}
      </div>

      <div class="diagnostic-summary">
        ${escapeHTML(item.fix || "Review this section.")}
      </div>

      <div class="diagnostic-impact">
        ${escapeHTML(item.impact)}
      </div>

    </div>
  `;
}

function renderDiagnosticsForPage(issues = []) {
  const container = document.getElementById("diagnosticList");

  if (!container) return;

  if (!issues.length) {
    container.innerHTML = `
      <div class="diagnostic-row">
        No issues detected.
      </div>
    `;
    return;
  }

  container.innerHTML =
    issues.map(renderDiagnosticItem).join("");
}

function getIssueSnippet(text = "", search = "") {
  if (!text || !search) return "";

  const index = text.toLowerCase().indexOf(search.toLowerCase());

  if (index === -1) return "";

  const start = Math.max(0, index - 25);
  const end = Math.min(text.length, index + search.length + 25);

  return text.slice(start, end).trim();
}

function normalizeIssueForDisplay(issue) {
  const message = typeof issue === "string" ? issue : issue?.message || "";
  const type = typeof issue === "string" ? "" : issue?.type || "";
  const lower = message.toLowerCase();

  const sourceText =
    typeof issue === "string"
      ? ""
      : issue?.sourceText || "";

  const issueText =
    typeof issue === "string"
      ? ""
      : issue?.text || "";

  const snippet =
    getIssueSnippet(sourceText, issueText);

  const proofSnippet =
    snippet
      ? `"${snippet}"`
      : "";

  if (type === "ampersand" || lower.includes("ampersand") || issueText === "&") {
  const ampSnippet =
    getIssueSnippet(sourceText, "&");

  return {
    label: "Ampersand detected",
    fix: "Preserved in clean text. For spoken output, consider changing & to the word and.",
    where: ampSnippet
      ? `Near: "${ampSnippet}"`
      : "Ampersand characters in the text.",
    why: "This is often clearer for TTS, IVR, narration, and accessibility tools.",
    impact: "May be read awkwardly by speech tools or confuse some listeners."
  };
}

if (
  lower.includes("@ symbol") ||
  lower.includes("at symbol") ||
  issueText === "@"
) {
  const atSnippet =
    getIssueSnippet(sourceText, "@");

  return {
    label: "At symbol detected",
    fix: "Preserved in clean text. For spoken output, consider changing @ to the word at.",
    where: atSnippet
      ? `Near: "${atSnippet}"`
      : "At symbols in the text.",
    why: "This is often clearer for narration, IVR, and screen-reader output.",
    impact: "May need spoken-text normalization depending on where the text will be used."
  };
}

if (
  lower.includes("db number") ||
  lower.includes("compact db") ||
  issueText === "DB number"
) {
  const dbMatch =
    String(sourceText).match(/\bDB\s*[-:]?\s*\d{4,}\b/i);

  return {
    label: "Compact DB number detected",
    fix: "Preserved in clean text. For SSML or IVR output, consider spacing the digits.",
    where: dbMatch
      ? `Near: "${dbMatch[0]}"`
      : "Compact DB-style number in the text.",
    why: "Speech systems may read compact numbers too quickly or unclearly.",
    impact: "May affect IVR, TTS, narration, or accessibility playback."
  };
}
  
  if (type === "extra-spacing" || lower.includes("spacing")) {
    return {
      label: "Extra spacing detected",
      fix: "Normalized extra spacing.",
      where: snippet
        ? `Near: "${snippet}"`
        : "Spacing clusters in the pasted text.",
      why: "Cleaner spacing makes text easier to scan.",
      impact: "May affect readability and visual consistency."
    };
  }

  if (type === "excess-line-breaks" || lower.includes("blank")) {
    return {
      label: "Extra blank lines detected",
      fix: "Tightened paragraph spacing.",
      where: snippet
        ? `Near: "${snippet}"`
        : "Between paragraphs containing multiple blank lines.",
      why: "Broken spacing can make short text harder to read.",
      impact: "May interrupt flow and make short text feel harder to follow."
    };
  }

  if (type === "hidden-characters" || lower.includes("hidden")) {
    return {
      label: "Hidden characters detected",
      fix: "Removed invisible formatting characters.",
      where: snippet
        ? `Near: "${snippet}"`
        : "Copied content from external sources.",
      why: "Hidden characters can cause strange formatting behavior.",
      impact: "May cause copy, paste, publishing, or screen-reader issues."
    };
  }

  if (type === "long-sentence" || lower.includes("long sentence")) {
    return {
      label: "Long sentence detected",
      fix: "Consider splitting this into shorter sentences.",
      proof: proofSnippet,
      where: snippet
        ? `Near: "${snippet}"`
        : "A sentence significantly longer than surrounding text.",
      why: "Long sentences can be harder to read or hear aloud.",
      impact: "May reduce readability and increase listening fatigue."
    };
  }

  if (type === "dash-character" || lower.includes("dash")) {
    const dashSnippet =
      getIssueSnippet(sourceText, "—") ||
      getIssueSnippet(sourceText, "–");

    return {
      label: "Dash character detected",
      fix: "Flagged for speech review.",
      where: dashSnippet
        ? `Near: "${dashSnippet}"`
        : "Em dash or en dash usage.",
      why: "Speech systems may pause awkwardly around long dashes.",
      impact: "May affect TTS pacing, narration flow, or screen-reader rhythm."
    };
  }

 

  if (lower.includes("filler")) {
    return {
      label: "Filler wording detected",
      fix: "Flagged for clarity review.",
      where: snippet
        ? `Near: "${snippet}"`
        : "Common filler words in the pasted text.",
      why: "Filler words can make text feel less direct.",
      impact: "May reduce clarity and make the text feel less polished."
    };
  }

  if (lower.includes("repeated words")) {
    return {
      label: "Repeated words detected",
      fix: "Flagged repeated wording.",
      where: snippet
        ? `Near: "${snippet}"`
        : "Repeated words in the pasted text.",
      why: "Repeated words are usually accidental copy or typing errors.",
      impact: "May make the text look unedited or harder to trust."
    };
  }

  if (lower.includes("common typos")) {
    return {
      label: "Possible typo detected",
      fix: "Flagged likely typo for review.",
      where: snippet
        ? `Near: "${snippet}"`
        : "Possible typo in the pasted text.",
      why: "Typos can distract readers and reduce trust.",
      impact: "May affect professionalism or readability."
    };
  }

  if (lower.includes("formal wording")) {
    return {
      label: "Overly formal wording detected",
      fix: "Consider replacing formal or AI-style phrasing with simpler wording.",
      proof: proofSnippet,
      where: snippet
        ? `Near: "${snippet}"`
        : "Formal or AI-style wording in the pasted text.",
      why: "Overly formal wording can make text feel robotic or harder to read.",
      impact: "May make the message feel less natural or less direct."
    };
  }

  return {
    label: message || "Observation",
    fix: "Review suggested.",
    where: snippet
      ? `Near: "${snippet}"`
      : "General text content.",
    why: "Reviewing findings helps keep text clean and readable.",
    impact: "May affect clarity, readability, or reuse depending on context."
  };
}

/* -----------------------------
   PASTELINT CLEAN
----------------------------- */

function setToolStatus(els, message) {
  if (!els.toolStatus) return;

  els.toolStatus.textContent = message;
  els.toolStatus.hidden = !message;
}

function setPageResultState(active) {
  if (!document.body.classList.contains("pdf-paste-page")) return;

  document.body.classList.toggle("has-clean-result", Boolean(active));
}

function handleClean(els) {
  const raw = getInputText(els);
  if (!raw) {
    setPageResultState(false);
    return;
  }

  const cleanMode = getCleanMode(els);
  const reviewMode = getReviewMode(els);
  const result = getCleanResult(raw, cleanMode, reviewMode);

  const postCleanWarnings = filterResolvedWarnings(
    result.warnings,
    result.text
  );

  setOutput(els, result.text);
  setPageResultState(Boolean(result.text));

  if (els.postCleanActions) {
    els.postCleanActions.hidden = false;
  }

  setToolStatus(els, "Cleaned text ready. Review the changes, then copy or rewrite in SecondDraft.");

  runPreAnalysis(els, postCleanWarnings, result.text);

  renderTextBrief(
    els,
    raw,
    result.text,
    result.changes,
    postCleanWarnings
  );

  renderEditPreview(
    els,
    result.edits,
    result.changes
  );

  renderVisualPreview(
    els,
    raw,
    result.text,
    result.changes
  );

  updateCounters(els);
}

function getCleanResult(raw, cleanMode, reviewMode = "paragraph") {
  let result;

  if (
    window.PasteLintCleanEngine &&
    typeof window.PasteLintCleanEngine.runPasteLintCleanup === "function"
  ) {
    const engineOptions = getEngineOptionsForMode(cleanMode);

    const engineResult =
      window.PasteLintCleanEngine.runPasteLintCleanup(raw, engineOptions);

    result = normalizeCleanResult({
      text: engineResult.cleanedText || engineResult.cleaned || "",
      changes: engineResult.changes || [],
      warnings: engineResult.warnings || [],
      edits: [],
      impact: {
        spaces: 0,
        lines: 0,
        punctuation: 0,
        typos: 0,
        repeatedWords: 0
      }
    });
  } else if (
    window.PasteLintCleanEngine &&
    typeof window.PasteLintCleanEngine.cleanText === "function"
  ) {
    const engineOptions = getEngineOptionsForMode(cleanMode);

    const engineResult =
      window.PasteLintCleanEngine.cleanText(raw, engineOptions);

    result = normalizeCleanResult({
      text: engineResult.cleaned || "",
      changes: engineResult.changes || [],
      warnings: engineResult.warnings || [],
      edits: [],
      impact: {
        spaces: 0,
        lines: 0,
        punctuation: 0,
        typos: 0,
        repeatedWords: 0
      }
    });
  } else {
    result = normalizeCleanResult(cleanText(raw, reviewMode));
  }

  return postProcessCleanResult(raw, result, reviewMode);
}

function normalizeCleanResult(result) {
  return {
    text: result?.text || "",
    changes: Array.isArray(result?.changes) ? result.changes : [],
    warnings: Array.isArray(result?.warnings) ? result.warnings : [],
    edits: Array.isArray(result?.edits) ? result.edits : [],
    impact: result?.impact || {
      spaces: 0,
      lines: 0,
      punctuation: 0,
      typos: 0,
      repeatedWords: 0
    }
  };
}

function postProcessCleanResult(raw, result, reviewMode = "paragraph") {
  const before = result.text;
  const after = normalizeSpacing(before, reviewMode);

  if (after !== before) {
    result.text = after;

    addChangeOnce(result.changes, {
      type: "spacing",
      message: "Cleaned extra spacing and blank lines."
    });
  }

  result.text = result.text.trim();

  return result;
}

function addChangeOnce(changes, change) {
  if (!Array.isArray(changes)) return;

  const alreadyExists = changes.some(item => item?.type === change.type);

  if (!alreadyExists) {
    changes.push(change);
  }
}

/* -----------------------------
   FALLBACK CLEAN ENGINE
----------------------------- */

function cleanText(text, mode = "paragraph") {
  const original = String(text);
  let cleaned = original;
  const changes = [];
  let edits = [];

  const beforeSpacing = cleaned;
  cleaned = normalizeSpacing(cleaned, mode);

  if (cleaned !== beforeSpacing) {
    changes.push({
      type: "spacing",
      message: "Cleaned extra spacing and blank lines."
    });
  }

  const beforeDashes = cleaned;
  cleaned = normalizeDashes(cleaned);

  if (cleaned !== beforeDashes) {
    changes.push({
      type: "dashes",
      message: "Normalized dash characters."
    });
  }

  const beforePunctuation = cleaned;
  cleaned = normalizePunctuationSpacing(cleaned);

  if (cleaned !== beforePunctuation) {
    changes.push({
      type: "punctuation-spacing",
      message: "Repaired spacing around punctuation."
    });
  }

  const typoResult = fixCommonTypos(cleaned);
  cleaned = typoResult.text;
  edits = edits.concat(typoResult.edits);

  if (typoResult.count > 0) {
    changes.push({
      type: "typos",
      message: `Corrected ${typoResult.count} common typo${typoResult.count === 1 ? "" : "s"}.`
    });
  }

  const repeatResult = fixRepeatedWords(cleaned);
  cleaned = repeatResult.text;
  edits = edits.concat(repeatResult.edits);

  if (repeatResult.count > 0) {
    changes.push({
      type: "repeated-words",
      message: `Removed ${repeatResult.count} repeated word${repeatResult.count === 1 ? "" : "s"}.`
    });
  }

  return {
    text: cleaned.trim(),
    changes,
    edits,
    impact: {
      spaces: cleaned !== beforeSpacing ? 1 : 0,
      lines: 0,
      punctuation: cleaned !== beforePunctuation ? 1 : 0,
      typos: typoResult.count,
      repeatedWords: repeatResult.count
    }
  };
}

function normalizeSpacing(text, mode = "paragraph") {
  const source = String(text)
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  if (mode === "line") {
    return source
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  const lines = source
    .split("\n")
    .map(line => line.trim());

  const rebuilt = [];
  let current = [];

  lines.forEach(line => {
    if (!line) {
      return;
    }

    current.push(line);

    const paragraphText = current.join(" ");

    const wordCount =
      paragraphText
        .split(/\s+/)
        .filter(Boolean)
        .length;

    const sentenceCount =
      paragraphText
        .split(/[.!?]+/)
        .filter(Boolean)
        .length;

    const looksLikeIVR =
      /\b(DB\d+|meeting|story|menu|press\s+\d+|dial|kids|books|email|library)\b/i
        .test(line);

    if (
      looksLikeIVR ||
      sentenceCount >= 5 ||
      wordCount >= 120
    ) {
      rebuilt.push(paragraphText);
      current = [];
    }
  });

  if (current.length) {
    rebuilt.push(current.join(" "));
  }

  return rebuilt
    .join("\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

/* -----------------------------
   PASTELINT RENDERING
----------------------------- */

function renderEditPreview(els, edits, changes = []) {
  const target = els.editMap || els.changePreview;
  if (!target) return;

  const engineChanges = Array.isArray(changes) ? changes : [];
  const safeEdits = Array.isArray(edits) ? edits : [];

  if (!safeEdits.length && !engineChanges.length) {
    target.textContent = "No visible edits yet.";
    return;
  }

  const changeItems = engineChanges.map(change => {
    if (typeof change === "string") {
      return `<div class="edit-item">${escapeHTML(change)}</div>`;
    }

    return `
      <div class="edit-item">

        <strong>${escapeHTML(formatChangeLabel(change.type || "Change"))}</strong>

        <div class="edit-proof">
          ${escapeHTML(change.message || "Cleanup applied")}
        </div>

      </div>
    `;
  });

  const editItems = safeEdits.map(edit => {
    return `
      <div class="edit-item compact-preview">
        <span class="edit-before">${escapeHTML(edit.before)}</span>
        <span class="edit-arrow">→</span>
        <span class="edit-after">${escapeHTML(edit.after)}</span>
      </div>
    `;
  });

  target.innerHTML = [...changeItems, ...editItems].join("");
}

function renderVisualPreview(els, before, after, changes = []) {
  const panel = els.visualPreview;
  if (!panel) return;

  if (!before || !after) {
    panel.textContent =
      "PasteLint will show a simple before and after view once text is cleaned.";
    return;
  }

  const previewRows = buildPreviewRows(before, after, changes);

  if (!previewRows.length) {
    panel.innerHTML =
      "<div>No visible cleanup differences detected.</div>";
    return;
  }

  panel.innerHTML = previewRows
    .map(row => `
      <div class="edit-item compact-preview">
        <span class="edit-before">${escapeHTML(row.before)}</span>
        <span class="edit-arrow">→</span>
        <span class="edit-after">${escapeHTML(row.after)}</span>
      </div>
    `)
    .join("");
}

function buildPreviewRows(before, after, changes = []) {
  const previewRows = [];

  const beforeText = String(before);
  const afterText = String(after);

  const changeTypes = Array.isArray(changes)
    ? changes.map(change => change.type).filter(Boolean)
    : [];

  if (changeTypes.includes("spacing")) {
    previewRows.push({
      before: "extra spacing",
      after: "normalized spacing"
    });
  }

  if (changeTypes.includes("dashes")) {
    previewRows.push({
      before: "em dash",
      after: "dash"
    });
  }

  if (changeTypes.includes("punctuation-spacing")) {
    previewRows.push({
      before: "punctuation spacing",
      after: "repaired punctuation"
    });
  }

  if (
    beforeText.includes("10:00") &&
    afterText.includes("10 00")
  ) {
    previewRows.push({
      before: "speech time",
      after: "10 00"
    });
  }

  if (
    beforeText.includes("@") &&
    !afterText.includes("@")
  ) {
    previewRows.push({
      before: "@ symbol",
      after: "at"
    });
  }

  return previewRows;
}

function renderTextBrief(els, before, after, changes = [], warnings = []) {
  if (!els.textBrief) return;

  if (!after) {
    els.textBrief.innerHTML = `
      <strong>Formatting quality</strong> — Waiting for analysis.<br>
      <strong>Readability score</strong> — Waiting for analysis.<br>
      <strong>Speech risks</strong> — Waiting for analysis.<br>
      <strong>Structure review</strong> — Waiting for analysis.
    `;
    return;
  }

  const removedChars = Math.max(0, String(before).length - String(after).length);

  const changeTypes = Array.isArray(changes)
    ? changes.map(change => change.type).filter(Boolean)
    : [];

  const speechWarningCount = Array.isArray(warnings)
    ? warnings.filter(warning =>
        String(warning.type || "").includes("speech")
      ).length
    : 0;

  const cleanedNotes = [];

  if (removedChars > 0) {
    cleanedNotes.push(`${removedChars} chars cleaned`);
  }

  if (changeTypes.includes("spacing")) {
    cleanedNotes.push("normalized spacing");
  }

  if (
    changeTypes.includes("dashes") ||
    changeTypes.includes("punctuation-spacing")
  ) {
    cleanedNotes.push("normalized punctuation");
  }

  const wordCount = countWords(after);

  const formattingStatus = cleanedNotes.length
    ? cleanedNotes.join(", ")
    : "No major formatting cleanup needed";

  const readabilityStatus = `${wordCount} words after cleanup`;

  const speechStatus = changeTypes.includes("dashes")
    ? "Dash cleanup may improve speech flow"
    : speechWarningCount
      ? `${speechWarningCount} speech-readiness item${speechWarningCount === 1 ? "" : "s"} preserved for review`
      : "No major speech risks detected";

  const structureStatus = changeTypes.includes("spacing")
    ? "Spacing and paragraph structure reviewed"
    : "Structure looks usable";

  els.textBrief.innerHTML = `
    <strong>Formatting quality</strong> — ${formattingStatus}.<br>
    <strong>Readability score</strong> — ${readabilityStatus}.<br>
    <strong>Speech risks</strong> — ${speechStatus}.<br>
    <strong>Structure review</strong> — ${structureStatus}.
  `;
}

/* -----------------------------
   COUNTERS
----------------------------- */

function updateCounters(els) {
  const input = els.input?.value || "";
  const output = els.output?.value || "";

  setText(els.inputCharCount, `${input.length} chars`);
  setText(els.inputWordCount, `${countWords(input)} words`);
  setText(els.outputCharCount, `${output.length} chars`);
  setText(els.outputWordCount, `${countWords(output)} words`);
}

function countWords(text) {
  return (String(text).trim().match(/\b\w+\b/g) || []).length;
}

/* -----------------------------
   COPY + CLEAR
----------------------------- */

function copyOutput(els) {
  if (!els.output?.value) {
    setToolStatus(els, "Nothing to copy yet.");
    return;
  }

  const confirmCopied = () => {
    if (!els.copyBtn) return;

    const originalText = els.copyBtn.textContent;
    els.copyBtn.textContent = "Copied";

    setTimeout(() => {
      els.copyBtn.textContent = originalText;
    }, 1200);

    setToolStatus(els, "Copied to clipboard.");
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(els.output.value)
      .then(confirmCopied)
      .catch(() => {
        els.output.select();
        document.execCommand("copy");
        confirmCopied();
      });
  } else {
    els.output.select();
    document.execCommand("copy");
    confirmCopied();
  }
}

function clearAll(els) {
  if (els.input) els.input.value = "";
  if (els.output) els.output.value = "";
  setPageResultState(false);

  updateCounters(els);
  renderEmptyIssues(els);

  if (els.textBrief) {
    els.textBrief.textContent =
      "Paste text above, then clean it to see a quick summary of what PasteLint found.";
  }

  if (els.impactPanel) {
    els.impactPanel.innerHTML = "<li>No changes yet.</li>";
  }

  if (els.changeSummary) {
    els.changeSummary.innerHTML = "<li>No improvements yet.</li>";
  }

  if (els.editMap) {
    els.editMap.textContent =
      "Changes will appear here after cleanup.";
  }

  if (els.visualPreview) {
    els.visualPreview.textContent =
      "PasteLint will show a simple before and after view once text is cleaned.";
  }

  if (els.postCleanActions) {
    els.postCleanActions.hidden = true;
  }

  setToolStatus(els, "");
}

/* -----------------------------
   HELPERS
----------------------------- */

function getInputText(els) {
  return els.input?.value.trim() || "";
}

function getCleanMode(els) {
  if (!els.cleanMode) return "standard";

  return els.cleanMode.value || "standard";
}

function getReviewMode(els) {
  if (!els.viewMode) return "paragraph";

  return els.viewMode.value === "line" ? "line" : "paragraph";
}

function getEngineOptionsForMode(mode) {
  const options = {
    normalizeSpeechSymbols: false,
    normalizeDbNumbers: false
  };

  if (mode === "ivr") {
    options.normalizeSpeechSymbols = true;
    options.normalizeDbNumbers = true;
  }

  return options;
}

function setOutput(els, text) {
  if (els.output) {
    els.output.value = text;
  }

  updateCounters(els);
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function formatChangeLabel(type) {
  return String(type || "Change")
    .replace(/-/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function dedupeList(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function dedupeIssues(items) {
  const seen = new Set();
  const output = [];

  (items || []).forEach(item => {
    const issue = String(item || "").trim();

    if (!issue) return;

    const key = getIssueKey(issue);

    if (seen.has(key)) return;

    seen.add(key);
    output.push(issue);
  });

  return output;
}

function getIssueKey(issue) {
  const lower = String(issue).toLowerCase();

  if (lower.includes("db number") || lower.includes("compact db")) return "db-number";
  if (lower.includes("@ symbol") || lower.includes("at symbol")) return "at-symbol";
  if (lower.includes("ampersand")) return "ampersand";

  if (lower.includes("sentence")) return "long-sentence";
  if (lower.includes("filler")) return "filler";
  if (lower.includes("repeated")) return "repeated";
  if (lower.includes("formal")) return "formal";
  if (lower.includes("spacing")) return "spacing";
  if (lower.includes("blank")) return "blank-lines";
  if (lower.includes("dash")) return "dash";
  if (lower.includes("symbol")) return "symbol";
  if (lower.includes("spoken")) return "spoken";
  if (lower.includes("typo")) return "typo";

  return lower;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
