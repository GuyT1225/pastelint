document.addEventListener("DOMContentLoaded", () => {
  const els = getElements();
  
  bindEvents(els);
  updateCounters(els);
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

    modeToggle: $("modeToggle"),

    issuePanel: $("analysisList", "foundList"),
    textBrief: $("textBrief"),
    impactPanel: $("impactList"),
    changeSummary: $("improvementList"),
    changePreview: $("changePreview"),
    editMap: $("editMap", "changePreview"),

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

  const fixed = text.replace(/\b[A-Za-z']+\b/g, word => {
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

  const fixed = text.replace(/\b(\w+)\s+\1\b/gi, (match, word) => {
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
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* -----------------------------
   PRE-ANALYSIS
----------------------------- */

function runPreAnalysis(els) {
  const text = getInputText(els);

  if (!text) {
    if (els.issuePanel) {
      els.issuePanel.innerHTML = "<li>Paste text to see a quick readability check.</li>";
    }
    return;
  }

  let issues = [];

  if (
    window.PasteLintAnalyzer &&
    typeof window.PasteLintAnalyzer.analyzeText === "function"
  ) {
    const analysis = window.PasteLintAnalyzer.analyzeText(text);

    issues = [
      ...(analysis.findings || []),
      ...(analysis.speechRisks || [])
    ].map(item => item.message);
  } else {
    issues = detectIssues(text);
  }

  if (els.issuePanel) {
    els.issuePanel.innerHTML = issues.length
      ? issues.map(issue => `<li>${escapeHTML(issue)}</li>`).join("")
      : "<li>No obvious issues detected.</li>";
}
}
function detectIssues(text) {
  const issues = [];
  const sentences = text.split(/[.!?]/).filter(Boolean);

  if (sentences.some(sentence => sentence.trim().split(/\s+/).length > 25)) {
    issues.push("Some sentences are too long");
  }

  if (/(very|really|basically|actually)/i.test(text)) {
    issues.push("Contains filler words");
  }

  if (hasRepetition(text)) {
    issues.push("Repeated words detected");
  }

  if (hasCommonTypos(text)) {
    issues.push("Possible common typos detected");
  }

  if (/(utilize|assistance|facilitate)/i.test(text)) {
    issues.push("Overly formal wording");
  }

  return issues;
}

function hasCommonTypos(text) {
  return Object.keys(COMMON_TYPOS).some(typo => {
    const pattern = new RegExp(`\\b${escapeRegExp(typo)}\\b`, "i");
    return pattern.test(text);
  });
}

function hasRepetition(text) {
  return /\b(\w+)\s+\1\b/i.test(text);
}

/* -----------------------------
   PASTELINT CLEAN
----------------------------- */

function handleClean(els) {
  const raw = getInputText(els);
  if (!raw) return;
  const mode = getCleanMode(els);

  let result;
  if (
    window.PasteLintCleanEngine &&
    typeof window.PasteLintCleanEngine.cleanText === "function"
  ) {
    const engineResult = window.PasteLintCleanEngine.cleanText(raw, {
      normalizeSpeechSymbols: false,
      normalizeDbNumbers: false
    });

    result = {
      text: engineResult.cleaned,
      changes: engineResult.changes || [],
      edits: [],
      impact: {
        spaces: 0,
        lines: 0,
        punctuation: 0,
        typos: 0,
        repeatedWords: 0
      }
    };
  } else {
    result = cleanText(raw, mode);
  }

  setOutput(els, result.text);
  runPreAnalysis(els);
  renderTextBrief(els, result.text);
  
  renderImpact(els, result.impact);
  renderChanges(els, result.changes);
  renderEditPreview(els, result.edits, result.changes);
  updateCounters(els);
}


/* -----------------------------
   PASTELINT RENDERING
----------------------------- */

function renderEditPreview(els, edits, changes = []) {
  const target = els.editMap || els.changePreview;
  if (!target) return;

  const engineChanges = Array.isArray(changes) ? changes : [];

  if ((!edits || edits.length === 0) && engineChanges.length === 0) {
    target.textContent = "No visible edits yet.";
    return;
  }

  const editItems = (edits || []).map(edit => {
    return `
      <div class="edit-item">
        <span class="edit-before">${escapeHTML(edit.before)}</span>
        <span class="edit-arrow">→</span>
        <span class="edit-after">${escapeHTML(edit.after)}</span>
      </div>
    `;
  });

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

  target.innerHTML = [...changeItems, ...editItems].join("");
}

function renderTextBrief(els, text) {
  if (!els.textBrief) return;

  if (!text) {
    els.textBrief.textContent =
      "Paste text above, then clean it to see a quick summary of what PasteLint found.";
    return;
  }

  if (
    window.PasteLintAnalyzer &&
    typeof window.PasteLintAnalyzer.analyzeText === "function"
  ) {
    const analysis = window.PasteLintAnalyzer.analyzeText(text);
    const stats = analysis.stats || {};

    els.textBrief.innerHTML = `
      ${stats.words || 0} words. 
      ${stats.sentences || 0} sentence${stats.sentences === 1 ? "" : "s"}. 
      ${stats.paragraphs || 0} paragraph${stats.paragraphs === 1 ? "" : "s"}. 
      Estimated read time: ${stats.estimatedReadTimeMinutes || 1} minute${stats.estimatedReadTimeMinutes === 1 ? "" : "s"}.
    `;
    return;
  }

  els.textBrief.textContent = `${countWords(text)} words.`;
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
  return (text.trim().match(/\b\w+\b/g) || []).length;
}

/* -----------------------------
   COPY + CLEAR
----------------------------- */

function copyOutput(els) {
  if (!els.output?.value) return;

  navigator.clipboard.writeText(els.output.value).catch(() => {
    els.output.select();
    document.execCommand("copy");
  });
}



function clearAll(els) {
  if (els.input) els.input.value = "";
  if (els.output) els.output.value = "";

  updateCounters(els);

  if (els.textBrief) {
     els.textBrief.textContent =
    "Paste text above, then clean it to see a quick summary of what PasteLint found.";
}

  if (els.issuePanel) {
    els.issuePanel.innerHTML = "<li>Paste text to see a quick readability check.</li>";
  }

  if (els.impactPanel) {
    els.impactPanel.innerHTML = "<li>No changes yet.</li>";
  }

  if (els.changeSummary) {
    els.changeSummary.innerHTML = "<li>No improvements yet.</li>";
  }

  if (els.changePreview) {
    els.changePreview.textContent =
"Paste text and click Clean Text to see visible changes.";  
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

function setOutput(els, text) {
  if (els.output) els.output.value = text;
}

function setText(el, text) {
  if (el) el.textContent = text;
}


function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
  
