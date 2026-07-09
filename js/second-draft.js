document.addEventListener("DOMContentLoaded", () => {
  const draftEls = getSecondDraftElements();

  bindSecondDraftEvents(draftEls);
  updateDraftCounters(draftEls);
  renderDraftQualityHint(draftEls);
});

/* -----------------------------
   ELEMENTS - SECONDDRAFT
----------------------------- */

function getSecondDraftElements() {
  return {
    input: document.getElementById("draftInput"),
    output: document.getElementById("draftOutput"),

    toneSelect: document.getElementById("toneSelect"),
    lengthSelect: document.getElementById("lengthSelect"),
    reflowToggle: document.getElementById("reflowToggle"),

    reviseBtn: document.getElementById("reviseBtn"),
    buildBriefBtn: document.getElementById("buildBriefBtn"),
    copyBtn: document.getElementById("copyBtn"),
    clearBtn: document.getElementById("clearBtn"),

    inputCharCount: document.getElementById("inputCharCount"),
    inputWordCount: document.getElementById("inputWordCount"),
    outputCharCount: document.getElementById("outputCharCount"),
    outputWordCount: document.getElementById("outputWordCount"),

    toolStatus: document.getElementById("toolStatus"),
    qualityHint: document.getElementById("qualityHint"),

    changeInsightEmpty: document.getElementById("changeInsightEmpty"),
    changeInsightList: document.getElementById("changeInsightList"),

    editMapEmpty: document.getElementById("editMapEmpty"),
    editMapList: document.getElementById("editMapList")
  };
}

/* -----------------------------
   EVENTS - SECONDDRAFT
----------------------------- */

function bindSecondDraftEvents(els) {
  if (!els.input && !els.output) return;

  els.input?.addEventListener("input", () => {
    updateDraftCounters(els);
    renderDraftQualityHint(els);
  });

  els.reviseBtn?.addEventListener("click", () => handleSecondDraftRevise(els));
  els.buildBriefBtn?.addEventListener("click", () => handleBuildAnalysisBrief(els));
  els.copyBtn?.addEventListener("click", () => copySecondDraftOutput(els));
  els.clearBtn?.addEventListener("click", () => clearSecondDraft(els));
}

/* -----------------------------
   SECONDDRAFT ENGINE
----------------------------- */

function handleSecondDraftRevise(els) {
  const raw = els.input?.value.trim() || "";
  if (!raw) return;

  const options = getSecondDraftOptions(els);
  const result = reviseSecondDraft(raw, options);

  if (els.output) els.output.value = result.text;

  renderSecondDraftInsights(els, result.changes);
  renderSecondDraftEditMap(els, result.edits);
  updateDraftCounters(els);
  setToolStatus(els, "Draft revised. Review the result, then copy or adjust the settings.");
}

function handleBuildAnalysisBrief(els) {
  const raw = els.input?.value.trim() || "";

  if (!raw) {
    if (els.qualityHint) {
      els.qualityHint.textContent = "Paste text first to build an analysis brief.";
    }
    return;
  }

  const brief = buildAnalysisBrief(raw);

  if (els.output) {
    els.output.value = brief;
  }

  renderSecondDraftInsights(els, [
    "Prepared the source material as an analysis-ready brief",
    "Added focus areas so the next review has clear instructions",
    "Kept the original text intact for evidence-based analysis"
  ]);

  renderSecondDraftEditMap(els, [
    {
      before: "Raw pasted text",
      after: "Structured analysis brief"
    }
  ]);

  updateDraftCounters(els);
  setToolStatus(els, "Draft revised. Review the result, then copy or adjust the settings.");
}

function buildAnalysisBrief(sourceText) {
  const source = prepareBriefSourceMaterial(sourceText);

  return `# Analysis Brief

## Source Material

${source}

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

Use the source material as the evidence base. Separate direct observations from interpretation.`;
}

function prepareBriefSourceMaterial(text) {
  return String(text)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSecondDraftOptions(els) {
  return {
    tone: els.toneSelect?.value || "natural",
    length: els.lengthSelect?.value || "same",
    reflow: Boolean(els.reflowToggle?.checked)
  };
}

function reviseSecondDraft(text, options) {
  let revised = normalizeSecondDraftText(text);
  const edits = [];
  const changes = [];

  const patternResult = applySecondDraftPatternRules(revised, options);
  revised = patternResult.text;
  edits.push(...patternResult.edits);
  changes.push(...patternResult.changes);

  const phraseResult = applySecondDraftPhraseRules(revised, options.tone);
  revised = phraseResult.text;
  edits.push(...phraseResult.edits);
  changes.push(...phraseResult.changes);

  const lengthResult = applySecondDraftLengthRules(revised, options.length);
  revised = lengthResult.text;
  edits.push(...lengthResult.edits);
  changes.push(...lengthResult.changes);

  if (options.reflow) {
    revised = reflowSecondDraftParagraphs(revised);
    changes.push("Reflowed text into cleaner paragraphs");
  }

  revised = cleanupSecondDraftSentenceFlow(revised);
  revised = normalizeSecondDraftText(revised);

  if (!edits.length && revised === normalizeSecondDraftText(text)) {
    changes.push("No major revision needed. The text already reads cleanly.");
  }

  return {
    text: revised,
    changes: uniqueSecondDraftItems(changes),
    edits
  };
}

function applySecondDraftPatternRules(text, options) {
  const edits = [];
  const changes = [];
  let revised = text;

  const outreachPattern =
    /\bI just wanted to reach out and let you know that I think it would probably be helpful to ([^.?!]+)([.?!]?)/i;

  const outreachMatch = revised.match(outreachPattern);

  if (outreachMatch) {
    const action = outreachMatch[1].trim();
    let replacement = "";

    if (options.length === "shorter") {
      replacement = `Let's ${action}.`;
      changes.push("Condensed the sentence into a shorter action statement");
    } else if (options.tone === "direct") {
      replacement = `I think we need to ${action}.`;
      changes.push("Made the message more direct while preserving intent");
    } else {
      replacement = `I wanted to reach out because it would be helpful to ${action}.`;
      changes.push("Smoothed the sentence while preserving a natural tone");
    }

    revised = revised.replace(outreachPattern, replacement);

    edits.push({
      before: outreachMatch[0],
      after: replacement
    });
  }

  const alignmentPattern =
    /\bI know everyone has been busy lately,\s*but I wanted to make sure we were all aligned and on the same page regarding the final version\.?/i;

  const alignmentMatch = revised.match(alignmentPattern);

  if (alignmentMatch) {
    let replacement = "";

    if (options.length === "shorter") {
      replacement = "Let's confirm the final version.";
      changes.push("Condensed alignment wording into a shorter action statement");
    } else if (options.tone === "direct") {
      replacement = "Let's confirm the final version before sending it.";
      changes.push("Replaced alignment filler with a clearer next step");
    } else {
      replacement = "I want to make sure we agree on the final version.";
      changes.push("Simplified business clutter into clearer wording");
    }

    revised = revised.replace(alignmentPattern, replacement);

    edits.push({
      before: alignmentMatch[0],
      after: replacement
    });
  }

  return { text: revised, edits, changes };
}

function applySecondDraftPhraseRules(text, tone) {
  let revised = text;
  const edits = [];
  const changes = [];

  const rules = [
    ["It is important to note that", "", "Removed unnecessary opening phrase"],
    ["due to the fact that", "because", "Simplified wordy phrasing"],
    ["in order to", "to", "Simplified wordy phrasing"],
    ["for the purpose of", "to", "Simplified wordy phrasing"],
    ["At this point in time", "Now", "Simplified time phrasing"],
    ["at this point in time", "now", "Simplified time phrasing"],
    ["currently in the process of", "currently", "Simplified process wording"],
    ["in the process of", "", "Removed wordy process phrasing"],
    ["just wanted to quickly reach out and", "", "Removed filler opening"],
    ["just wanted to", "", "Removed filler wording"],
    ["quickly reach out", "reach out", "Simplified wording"],
    ["let you know that", "", "Removed unnecessary setup phrase"],
    ["I think it would probably be helpful to", "", "Removed hesitant phrasing"],
    ["probably be helpful to", "be helpful to", "Reduced hesitant phrasing"],
    ["basically", "", "Removed filler wording"],
    ["actually", "", "Removed filler wording"],
    ["utilize", "use", "Simplified formal wording"],
    ["assistance", "help", "Made wording more natural"],
    ["facilitate", "help", "Made wording more direct"],
    ["with regard to", "about", "Simplified formal wording"],
    ["prior to", "before", "Simplified formal wording"]
  ];

  if (tone === "direct") {
    rules.push(
      ["I would like to", "", "Made wording more direct"],
      ["It seems that", "", "Removed hesitant phrasing"],
      ["Please be advised that", "", "Removed overly formal phrasing"],
      ["I think", "", "Removed hesitation"],
      ["probably", "", "Removed uncertainty"],
      ["may", "can", "Made wording more direct"]
    );
  }

  if (tone === "professional") {
    rules.push(
      ["a lot of", "many", "Made wording more professional"],
      ["get", "receive", "Adjusted casual wording"],
      ["help", "assist", "Used more professional wording"],
      ["need", "require", "Used more professional wording"],
      ["show", "demonstrate", "Used more professional wording"]
    );
  }

  if (tone === "friendly") {
    rules.push(
      ["receive", "get", "Made wording more conversational"],
      ["assist", "help", "Made wording warmer"],
      ["require", "need", "Made wording more conversational"],
      ["demonstrate", "show", "Made wording more conversational"]
    );
  }

  rules.forEach(([before, after, change]) => {
    const result = replaceSecondDraftPhraseWithEdit(revised, before, after);
    revised = result.text;

    if (result.count > 0) {
      changes.push(change);
      edits.push(...result.edits);
    }
  });

  return { text: revised, edits, changes };
}

function applySecondDraftLengthRules(text, length) {
  const changes = [];
  const edits = [];
  let revised = text;

  if (length === "shorter") {
    const beforeText = revised;

    revised = revised
      .replace(/\bvery\b/gi, "")
      .replace(/\breally\b/gi, "")
      .replace(/\bbasically\b/gi, "")
      .replace(/\bactually\b/gi, "")
      .replace(/\bin my opinion\b/gi, "")
      .replace(/\bi think that\b/gi, "I think")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (revised !== beforeText) {
      changes.push("Tightened wording to make the draft shorter");
      edits.push({
        before: "Wordier phrasing",
        after: "Shorter phrasing"
      });
    }
  }

  if (length === "expand") {
    const beforeText = revised;

    revised = expandSecondDraftText(revised);

    if (revised !== beforeText) {
      changes.push("Expanded the draft slightly for smoother context and flow");
      edits.push({
        before: "Shorter draft",
        after: "Slightly fuller draft"
      });
    }
  }

  return { text: revised, edits, changes };
}

function expandSecondDraftText(text) {
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [text];

  if (sentences.length <= 1) {
    return text + " This gives the reader a little more context while preserving the original meaning.";
  }

  return sentences
    .map((sentence, index) => {
      const clean = sentence.trim();

      if (index === 0 && clean.split(/\s+/).length < 14) {
        return clean + " This helps frame the main point more clearly.";
      }

      return clean;
    })
    .join(" ");
}

function replaceSecondDraftPhraseWithEdit(text, before, after) {
  const edits = [];
  const pattern = new RegExp(`\\b${escapeSecondDraftRegExp(before)}\\b`, "g");

  let count = 0;

  const updated = text.replace(pattern, (match) => {
    count++;

    edits.push({
      before: match,
      after: after || "[removed]"
    });

    return after;
  });

  return { text: updated, count, edits };
}

function reflowSecondDraftParagraphs(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

function cleanupSecondDraftSentenceFlow(text) {
  return String(text)
    .replace(/\band It\b/g, ". It")
    .replace(/\band it\b/g, ". It")
    .replace(/\s+\./g, ".")
    .replace(/\.\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeSecondDraftText(text) {
  return String(text)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*,/g, ".")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|[.!?]\s+)([a-z])/g, (match, start, letter) => {
      return start + letter.toUpperCase();
    })
    .trim();
}

/* -----------------------------
   SECONDDRAFT RENDERING
----------------------------- */

function renderDraftQualityHint(els) {
  if (!els.qualityHint) return;

  const text = els.input?.value.trim() || "";

  if (!text) {
    els.qualityHint.textContent = "Paste text to revise.";
    return;
  }

  const issues = detectSecondDraftIssues(text);

  els.qualityHint.textContent = issues.length
    ? `Detected: ${issues.join(", ")}.`
    : "Looks ready for a light clarity pass.";
}

function detectSecondDraftIssues(text) {
  const issues = [];
  const sentences = text.split(/[.!?]/).filter(Boolean);

  if (sentences.some((sentence) => sentence.trim().split(/\s+/).length > 25)) {
    issues.push("long sentences");
  }

  if (/(very|really|basically|actually|probably|just wanted|at this point in time)/i.test(text)) {
    issues.push("filler wording");
  }

  if (/(utilize|assistance|facilitate|with regard to|prior to)/i.test(text)) {
    issues.push("overly formal wording");
  }

  return issues;
}

function renderSecondDraftInsights(els, changes) {
  if (els.changeInsightEmpty) {
    els.changeInsightEmpty.hidden = Boolean(changes && changes.length);
  }

  if (!els.changeInsightList) return;

  els.changeInsightList.innerHTML = changes && changes.length
    ? changes.map((change) => `<li>${escapeSecondDraftHTML(change)}</li>`).join("")
    : "";
}

function renderSecondDraftEditMap(els, edits) {
  if (els.editMapEmpty) {
    els.editMapEmpty.hidden = Boolean(edits && edits.length);
  }

  if (!els.editMapList) return;

  els.editMapList.innerHTML = edits && edits.length
    ? edits.map((edit) => {
        return `
          <div class="edit-item">
            <span class="edit-before">${escapeSecondDraftHTML(edit.before)}</span>
            <span class="edit-arrow">→</span>
            <span class="edit-after">${escapeSecondDraftHTML(edit.after)}</span>
          </div>
        `;
      }).join("")
    : "";
}

/* -----------------------------
   COUNTERS, COPY, CLEAR
----------------------------- */

function updateDraftCounters(els) {
  const input = els.input?.value || "";
  const output = els.output?.value || "";

  setSecondDraftText(els.inputCharCount, `${input.length} chars`);
  setSecondDraftText(els.inputWordCount, `${countSecondDraftWords(input)} words`);
  setSecondDraftText(els.outputCharCount, `${output.length} chars`);
  setSecondDraftText(els.outputWordCount, `${countSecondDraftWords(output)} words`);
}

function setToolStatus(els, message) {
  if (!els.toolStatus) return;

  els.toolStatus.textContent = message;
  els.toolStatus.hidden = !message;
}

function copySecondDraftOutput(els) {
  if (!els.output?.value) {
    setToolStatus(els, "Nothing to copy yet.");
    return;
  }

  const confirmCopied = () => {
    setToolStatus(els, "Copied to clipboard.");
  };

  const fallbackCopy = () => {
    try {
      els.output.select();
      document.execCommand("copy");
      confirmCopied();
    } catch (error) {
      setToolStatus(els, "Copy failed. Select the text and copy manually.");
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(els.output.value)
      .then(confirmCopied)
      .catch(fallbackCopy);
    return;
  }

  fallbackCopy();
}

function clearSecondDraft(els) {
  if (els.input) els.input.value = "";
  if (els.output) els.output.value = "";

  updateDraftCounters(els);

  if (els.qualityHint) {
    els.qualityHint.textContent = "Paste text to revise.";
  }

  if (els.changeInsightEmpty) {
    els.changeInsightEmpty.hidden = false;
  }

  if (els.changeInsightList) {
    els.changeInsightList.innerHTML = "";
  }

  if (els.editMapEmpty) {
    els.editMapEmpty.hidden = false;
  }

  if (els.editMapList) {
    els.editMapList.innerHTML = "";
  }

  setToolStatus(els, "");
}

/* -----------------------------
   SMALL HELPERS
----------------------------- */

function setSecondDraftText(element, text) {
  if (element) element.textContent = text;
}

function countSecondDraftWords(text) {
  return (String(text).trim().match(/\b[\w'-]+\b/g) || []).length;
}

function uniqueSecondDraftItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function escapeSecondDraftRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeSecondDraftHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
