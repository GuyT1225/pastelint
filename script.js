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
    input: $("inputText", "input"),
    output: $("outputText", "output"),

    cleanBtn: $("cleanBtn"),
    copyBtn: $("copyBtn"),
    clearBtn: $("clearBtn"),

    inputCharCount: $("inputCharCount"),
    inputWordCount: $("inputWordCount"),
    outputCharCount: $("outputCharCount"),
    outputWordCount: $("outputWordCount"),

    modeToggle: $("modeToggle"),

    issuePanel: $("analysisList"),
    impactPanel: $("impactList"),
    changeSummary: $("improvementList"),
    changePreview: $("changePreview"),

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
    if (els.issuePanel) els.issuePanel.innerHTML = "<li>Paste text to see a quick readability check.</li>";
    return;
  }

  const issues = detectIssues(text);

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
  const result = cleanText(raw, mode);

  setOutput(els, result.text);
  renderImpact(els, result.impact);
  renderChanges(els, result.changes);
  renderEditPreview(els, result.edits);
  updateCounters(els);
}

function cleanText(text, mode = "paragraph") {
  let cleaned = text;
  const edits = [];

  const impact = {
    spaces: 0,
    lines: 0,
    punctuation: 0,
    typos: 0,
    repeatedWords: 0
  };

  cleaned = cleaned.replace(/[ \t]{2,}/g, () => {
    impact.spaces++;
    return " ";
  });

  cleaned = cleaned.replace(/\n{3,}/g, () => {
    impact.lines++;
    return "\n\n";
  });

  cleaned = cleaned.replace(/\s+([,.;!?])/g, (match, punctuation) => {
    impact.punctuation++;
    return punctuation;
  });

  const typoResult = fixCommonTypos(cleaned);
  cleaned = typoResult.text;
  impact.typos = typoResult.count;
  edits.push(...typoResult.edits);

  const repeatedWordResult = fixRepeatedWords(cleaned);
  cleaned = repeatedWordResult.text;
  impact.repeatedWords = repeatedWordResult.count;
  edits.push(...repeatedWordResult.edits);

  cleaned = applyCleanMode(cleaned, mode);

  return {
    text: cleaned.trim(),
    impact,
    edits,
    changes: [
      impact.spaces && "Collapsed extra spaces",
      impact.lines && "Reduced excessive line breaks",
      impact.punctuation && "Fixed punctuation spacing",
      impact.typos && `Fixed ${impact.typos} common typo${impact.typos === 1 ? "" : "s"}`,
      impact.repeatedWords && `Removed ${impact.repeatedWords} repeated word${impact.repeatedWords === 1 ? "" : "s"}`,
      mode === "line" && "Flattened text into clean single lines",
      mode === "paragraph" && "Grouped text into readable paragraphs"
    ].filter(Boolean)
  };
}

function applyCleanMode(text, mode) {
  if (mode === "line") {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  return text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n\n");
}



/* -----------------------------
   PASTELINT RENDERING
----------------------------- */

function renderImpact(els, impact) {
  if (!els.impactPanel) return;

  const parts = [];

  if (impact.shortened > 0) {
    parts.push(`Shortened by ${impact.shortened} characters`);
  }

  if (impact.spaces) parts.push("Removed extra spaces");
  if (impact.lines) parts.push("Reduced line breaks");
  if (impact.punctuation) parts.push("Fixed punctuation spacing");

  if (impact.typos) {
    parts.push(`Fixed ${impact.typos} common typo${impact.typos === 1 ? "" : "s"}`);
  }

  if (impact.repeatedWords) {
    parts.push(`Removed ${impact.repeatedWords} repeated word${impact.repeatedWords === 1 ? "" : "s"}`);
  }

  els.impactPanel.innerHTML = parts.length
    ? parts.map(part => `<li>${escapeHTML(part)}</li>`).join("")
    : "<li>No major changes.</li>";
}

function renderChanges(els, changes) {
  if (!els.changeSummary) return;

  els.changeSummary.innerHTML = changes && changes.length
    ? changes.map(change => `<li>${escapeHTML(change)}</li>`).join("")
    : "<li>No major cleanup needed.</li>";
}

function renderEditPreview(els, edits) {
  if (!els.changePreview) return;

  if (!edits || edits.length === 0) {
    els.changePreview.textContent = "No visible word-level edits yet.";
    return;
  }

  els.changePreview.innerHTML = edits
    .map(edit => {
      return `
        <div class="edit-item">
          <span class="edit-before">${escapeHTML(edit.before)}</span>
          <span class="edit-arrow">→</span>
          <span class="edit-after">${escapeHTML(edit.after)}</span>
        </div>
      `;
    })
    .join("");
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
"Paste text and click Clean Text to see visible changes.";  }
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
  
