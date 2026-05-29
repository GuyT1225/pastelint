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

    modeToggle: $("modeToggle", "viewMode"),

    issuePanel: $("analysisList", "foundList"),
    textBrief: $("textBrief"),
    impactPanel: $("impactList"),
    changeSummary: $("improvementList"),
    changePreview: $("changePreview"),
    editMap: $("editMap"),
    visualPreview: $("visualPreview")
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

function runPreAnalysis(els) {
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

    issues = dedupeStructuredIssues([
      ...analyzerIssues,
      ...localIssues
    ]);
  } else {
    issues = dedupeIssues(detectIssues(text));
  }

  renderGroupedIssues(els, issues);
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

    if (
      type.includes("dash") ||
      type.includes("ampersand") ||
      type.includes("speech") ||
      message.includes("dash") ||
      message.includes("ampersand")
    ) {
      groups.speech.items.push(issue);
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

function renderDiagnosticItem(issue) {
  const item = normalizeIssueForDisplay(issue);

  return `
    <div class="diagnostic-row">
      <strong>${escapeHTML(item.label)}</strong>

      <span class="diagnostic-fix">
        <strong>Fix:</strong>
        ${escapeHTML(item.fix)}
      </span>

      <span class="diagnostic-where">
        <strong>Where:</strong>
        ${escapeHTML(item.where)}
      </span>

      <small>
        <strong>Why:</strong>
        ${escapeHTML(item.why)}
      </small>
    </div>
  `;
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

  if (type === "extra-spacing" || lower.includes("spacing")) {
    return {
      label: "Extra spacing detected",
      fix: "Normalized extra spacing.",
      where: "Spacing clusters in the pasted text.",
      why: "Cleaner spacing makes text easier to scan."
    };
  }

  if (type === "excess-line-breaks" || lower.includes("blank")) {
    return {
      label: "Extra blank lines detected",
      fix: "Tightened paragraph spacing.",
      where: "Between paragraphs containing multiple blank lines.",
      why: "Broken spacing can make short text harder to read."
    };
  }

  if (type === "hidden-characters" || lower.includes("hidden")) {
    return {
      label: "Hidden characters detected",
      fix: "Removed invisible formatting characters.",
      where: "Copied content from external sources.",
      why: "Hidden characters can cause strange formatting behavior."
    };
  }

  if (type === "long-sentence" || lower.includes("long sentence")) {
  return {
    label: "Long sentence detected",
    fix: "Flagged for readability review.",
    where: snippet
      ? `Near: "${snippet}"`
      : "A sentence significantly longer than surrounding text.",
    why: "Long sentences can be harder to read or hear aloud."
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
    why: "Speech systems may pause awkwardly around long dashes."
  };
}

 if (type === "ampersand" || lower.includes("ampersand")) {
  const ampSnippet =
    getIssueSnippet(sourceText, "&");

  return {
    label: "Ampersand detected",
    fix: "Suggested replacing with the word and.",
    where: ampSnippet
      ? `Near: "${ampSnippet}"`
      : "Ampersand characters in the text.",
    why: "This is often clearer for TTS and accessibility tools."
  };
}

  return {
    label: message || "Observation",
    fix: "Review suggested.",
    where: "General text content.",
    why: "Reviewing findings helps keep text clean and readable."
  };
}

function detectIssues(text) {
  const source = String(text);
  const issues = [];
  const sentences = source.split(/[.!?]/).filter(Boolean);

  if (
    sentences.some(
      sentence => sentence.trim().split(/\s+/).length > 25
    )
  ) {
    issues.push("Some sentences are too long");
  }

  if (/(very|really|basically|actually)/i.test(source)) {
    issues.push("Contains filler words");
  }

  if (hasRepetition(source)) {
    issues.push("Repeated words detected");
  }

  if (hasCommonTypos(source)) {
    issues.push("Possible common typos detected");
  }

  if (/(utilize|assistance|facilitate|leverage|delve|unlock potential|drive outcomes|seamless integration|tapestry)/i.test(source)) {
    issues.push("Overly formal wording");
  }

  return issues;
}

function hasRepetition(text) {
  return /\b(\w+)\s+\1\b/i.test(text);
}

function hasCommonTypos(text) {
  return Object.keys(COMMON_TYPOS).some(typo => {
    const pattern = new RegExp(
      `\\b${escapeRegExp(typo)}\\b`,
      "i"
    );

    return pattern.test(text);
  });
}

/* -----------------------------
   PASTELINT CLEAN
----------------------------- */

function handleClean(els) {
  const raw = getInputText(els);
  if (!raw) return;

  const mode = getCleanMode(els);
  const result = getCleanResult(raw, mode);

  setOutput(els, result.text);
  runPreAnalysis(els);

  renderTextBrief(
    els,
    raw,
    result.text,
    result.changes
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

function getCleanResult(raw, mode) {
  let result;

  if (
    window.PasteLintCleanEngine &&
    typeof window.PasteLintCleanEngine.cleanText === "function"
  ) {
   const engineOptions = getEngineOptionsForMode(mode);

   const engineResult = window.PasteLintCleanEngine.cleanText(raw, engineOptions);

    result = normalizeCleanResult({
      text: engineResult.cleaned || "",
      changes: engineResult.changes || [],
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
    result = normalizeCleanResult(cleanText(raw, mode));
  }

  return postProcessCleanResult(raw, result, mode);
}

function normalizeCleanResult(result) {
  return {
    text: result?.text || "",
    changes: Array.isArray(result?.changes) ? result.changes : [],
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

function postProcessCleanResult(raw, result, mode) {
  const before = result.text;
  const after = normalizeSpacing(before, mode);

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

    const paragraphText =
      current.join(" ");

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
        <strong>${escapeHTML(change.type || "Change")}</strong>
        <span>${escapeHTML(change.message || "Updated text.")}</span>
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

function renderTextBrief(els, before, after, changes = []) {
  if (!els.textBrief) return;

  if (!after) {
    els.textBrief.textContent =
      "Paste text above, then clean it to see a quick summary of what PasteLint found.";
    return;
  }

  const removedChars = Math.max(0, String(before).length - String(after).length);

  const changeTypes = Array.isArray(changes)
    ? changes.map(change => change.type).filter(Boolean)
    : [];

  const cleanedNotes = [];

  if (removedChars > 0) {
    cleanedNotes.push(`${removedChars} chars cleaned`);
  }

  if (changeTypes.includes("spacing")) {
    cleanedNotes.push("Normalized spacing");
  }

  if (
    changeTypes.includes("dashes") ||
    changeTypes.includes("punctuation-spacing")
  ) {
    cleanedNotes.push("Normalized punctuation");
  }

  if (
    window.PasteLintAnalyzer &&
    typeof window.PasteLintAnalyzer.analyzeText === "function"
  ) {
    const analysis = window.PasteLintAnalyzer.analyzeText(after);
    const stats = analysis.stats || {};

    const summary =
      `${stats.words || 0} words. ` +
      `${stats.sentences || 0} sentence${stats.sentences === 1 ? "" : "s"}. ` +
      `${stats.paragraphs || 0} paragraph${stats.paragraphs === 1 ? "" : "s"}. ` +
      `Estimated read time: ${stats.estimatedReadTimeMinutes || 1} minute${stats.estimatedReadTimeMinutes === 1 ? "" : "s"}.`;

    els.textBrief.textContent = cleanedNotes.length
      ? `${summary} ${cleanedNotes.join(", ")}.`
      : summary;

    return;
  }

  els.textBrief.textContent = cleanedNotes.length
    ? `${countWords(after)} words. ${cleanedNotes.join(", ")}.`
    : `${countWords(after)} words.`;
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
  if (!els.output?.value) return;

  const confirmCopied = () => {
    if (!els.copyBtn) return;

    const originalText = els.copyBtn.textContent;
    els.copyBtn.textContent = "Copied";

    setTimeout(() => {
      els.copyBtn.textContent = originalText;
    }, 1200);
  };

  navigator.clipboard.writeText(els.output.value)
    .then(confirmCopied)
    .catch(() => {
      els.output.select();
      document.execCommand("copy");
      confirmCopied();
    });
}

function clearAll(els) {
  if (els.input) els.input.value = "";
  if (els.output) els.output.value = "";

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
}

/* -----------------------------
   HELPERS
----------------------------- */

function getInputText(els) {
  return els.input?.value.trim() || "";
}

function getCleanMode(els) {
  if (!els.modeToggle) return "paragraph";

  if (els.modeToggle.type === "checkbox") {
    return els.modeToggle.checked ? "line" : "paragraph";
  }

  return els.modeToggle.value === "line" ? "line" : "paragraph";
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

  if (lower.includes("sentence")) return "long-sentence";
  if (lower.includes("filler")) return "filler";
  if (lower.includes("repeated")) return "repeated";
  if (lower.includes("formal")) return "formal";
  if (lower.includes("spacing")) return "spacing";
  if (lower.includes("blank")) return "blank-lines";
  if (lower.includes("dash")) return "dash";
  if (lower.includes("symbol")) return "symbol";
  if (lower.includes("ampersand")) return "ampersand";
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
