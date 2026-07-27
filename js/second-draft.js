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
    outputPanel: document.querySelector(".second-draft-page .output-panel"),

    toneSelect: document.getElementById("toneSelect"),
    lengthSelect: document.getElementById("lengthSelect"),
    reflowToggle: document.getElementById("reflowToggle"),

    reviseBtn: document.getElementById("reviseBtn"),
    buildBriefBtn: document.getElementById("buildBriefBtn"),
    prepareSsmlLink: document.querySelector(".second-draft-page .next-step-action[href='SSML_builder.html']"),
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
  els.prepareSsmlLink?.addEventListener("click", () => handlePrepareSecondDraftForSsml(els));
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
  els.outputPanel?.classList.add("is-active-result");

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
  els.outputPanel?.classList.add("is-active-result");

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

function handlePrepareSecondDraftForSsml(els) {
  const transferText = getSecondDraftTransferText(els);

  if (!transferText) return;

  try {
    localStorage.setItem("pastelint-transfer-text", transferText);
  } catch (error) {
    setToolStatus(els, "Prepare for SSML opened. Copy the text manually if it does not appear there.");
  }
}

function getSecondDraftTransferText(els) {
  const revisedText = els.output?.value || "";
  const inputText = els.input?.value || "";

  return revisedText.trim() ? revisedText : inputText;
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
  const normalizedOriginal = normalizeSecondDraftText(text);
  const edits = [];
  const changes = [];
  const ruleMatches = [];
  const pendingVerifiedEdits = [];

  const patternResult = applySecondDraftPatternRules(revised, options);
  revised = patternResult.text;
  edits.push(...patternResult.edits);
  changes.push(...patternResult.changes);
  ruleMatches.push(...patternResult.ruleMatches);
  pendingVerifiedEdits.push(...patternResult.pendingVerifiedEdits);

  const phraseResult = applySecondDraftPhraseRules(revised, options.tone);
  revised = phraseResult.text;
  edits.push(...phraseResult.edits);
  changes.push(...phraseResult.changes);
  ruleMatches.push(...phraseResult.ruleMatches);

  const lengthResult = applySecondDraftLengthRules(revised, options.length);
  revised = lengthResult.text;
  edits.push(...lengthResult.edits);
  changes.push(...lengthResult.changes);
  ruleMatches.push(...lengthResult.ruleMatches);

  const beforeReflow = revised;

  if (options.reflow) {
    revised = reflowSecondDraftParagraphs(revised);
  }

  revised = cleanupSecondDraftSentenceFlow(revised);
  revised = normalizeSecondDraftText(revised);

  pendingVerifiedEdits.forEach((edit) => {
    if (!revised.includes(edit.after)) return;

    edits.push({
      before: edit.before,
      after: edit.after,
      ruleId: edit.ruleId
    });
    changes.push(edit.change);
    pushSecondDraftRuleMatch(
      ruleMatches,
      edit.ruleId,
      edit.change
    );
  });

  const reflowChangedStructure =
    options.reflow &&
    hasSecondDraftParagraphStructureChanged(beforeReflow, revised);

  if (reflowChangedStructure) {
    changes.push("Reflowed text into cleaner paragraphs");
    pushSecondDraftRuleMatch(
      ruleMatches,
      "SD-STRUCTURE-001",
      "Reflowed text into cleaner paragraphs"
    );
  }

  if (!edits.length && !reflowChangedStructure && revised === normalizedOriginal) {
    changes.push("No major revision needed. The text already reads cleanly.");
  }

  return {
    text: revised,
    changes: uniqueSecondDraftItems(changes),
    edits,
    ruleMatches: uniqueSecondDraftRuleMatches(ruleMatches)
  };
}

function applySecondDraftPatternRules(text, options) {
  const edits = [];
  const changes = [];
  const ruleMatches = [];
  const pendingVerifiedEdits = [];
  let revised = text;

  const applyRewrite = (pattern, buildReplacement, change, ruleId) => {
    const match = revised.match(pattern);
    if (!match) return;

    const replacement = ensureSecondDraftSentence(
      buildReplacement(match).trim()
    );

    revised = revised.replace(pattern, replacement);

    edits.push({
      before: match[0],
      after: replacement,
      ruleId
    });

    changes.push(change);
    pushSecondDraftRuleMatch(ruleMatches, ruleId, change);
  };

  const focusedMode =
    options.tone === "direct" ||
    options.tone === "concise" ||
    options.length === "shorter";

  const notificationResult = rewriteSecondDraftNotificationFrames(revised);
  revised = notificationResult.text;
  edits.push(...notificationResult.edits);
  changes.push(...notificationResult.changes);
  ruleMatches.push(...notificationResult.ruleMatches);

  applyRewrite(
    /\bI just wanted to reach out and say that\s+([^.!?]+)([.?!]?)/i,
    (match) => {
      const clause = match[1].trim();

      if (options.tone === "direct" || options.length === "shorter") {
        return makeSecondDraftDirectAction(clause);
      }

      return capitalizeSecondDraftSentence(clause);
    },
    "Rewrote a filler opening into a clearer sentence",
    "SD-CLARITY-001"
  );

  if (focusedMode) {
    applyRewrite(
      /\bI think there are a few areas where the wording could be improved,\s+and it may be helpful to make it a little clearer and more concise([.?!]?)/i,
      () => "The wording could be clearer and more concise.",
      "Condensed weak phrasing into a clearer sentence",
      "SD-COMPRESSION-001"
    );

    applyRewrite(
      /\bThere are a few areas where the wording could be improved([.?!]?)/i,
      () => "The wording could be clearer.",
      "Condensed weak phrasing into a clearer sentence",
      "SD-COMPRESSION-001"
    );

    applyRewrite(
      /\bAlso,\s+I wanted to mention that the current version feels a bit long and maybe slightly repetitive in certain places([.?!]?)/i,
      () => "The current version feels long and repetitive in places.",
      "Removed setup wording and tightened the observation",
      "SD-REPETITION-001"
    );

    applyRewrite(
      /\bThe main point is that we should\s+([^.!?]+)([.?!]?)/i,
      (match) => makeSecondDraftDirectAction(`we should ${match[1].trim()}`),
      "Turned the main point into a direct action",
      "SD-CLARITY-002"
    );

    applyRewrite(
      /\bLet me know if you think this is something we should handle today or if it can wait until tomorrow([.?!]?)/i,
      () => {
        if (options.tone === "direct") {
          return "Tell me whether we should handle this today or tomorrow.";
        }

        return "Let me know whether we should handle this today or tomorrow.";
      },
      "Tightened the timing question"
    );
  }

  applyRewrite(
    /\bI wanted to mention that\s+([^.!?]+)([.?!]?)/i,
    (match) => capitalizeSecondDraftSentence(match[1].trim()),
    "Removed an unnecessary setup phrase",
    "SD-CLARITY-001"
  );

  if (options.tone === "direct") {
    const requestResult = rewriteSecondDraftHesitantRequests(revised);
    revised = requestResult.text;
    pendingVerifiedEdits.push(...requestResult.pendingVerifiedEdits);

    applyRewrite(
      /\bI think there are a few areas where we can\s+([^.!?]+)([.?!]?)/i,
      (match) => {
        const action = match[1].trim();
        const improveMatch = action.match(/^improve\s+(.+)$/i);

        if (improveMatch) {
          return `We can improve a few areas of ${improveMatch[1].trim()}`;
        }

        return `We can ${action}`;
      },
      "Made a hesitant sentence more direct"
    );

    applyRewrite(
      /\bIt may be helpful to\s+([^.!?]+)([.?!]?)/i,
      (match) => makeSecondDraftDirectAction(match[1].trim()),
      "Made a suggested action more direct"
    );

    applyRewrite(
      /\bI think we should probably\s+([^.!?]+)([.?!]?)/i,
      (match) => capitalizeSecondDraftSentence(match[1].trim()),
      "Removed hesitation from the recommendation"
    );
  }

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

  return {
    text: revised,
    edits,
    changes,
    ruleMatches,
    pendingVerifiedEdits
  };
}

function rewriteSecondDraftHesitantRequests(text) {
  const pendingVerifiedEdits = [];
  const change = "Rewrote hesitant request framing into a clear, professional action";
  const ruleId = "SD-CLARITY-002";
  const pattern =
    /(^|[.!?]\s+|\n+)((?:(?:I\s+was|We\s+were)\s+hoping\s+(?:you\s+might\s+be\s+able\s+to|you\s+could)|(?:I\s+was|We\s+were)\s+wondering\s+if\s+you\s+could|(?:I|We)\s+just\s+wanted\s+to\s+ask\s+if\s+you\s+could|When\s+you\s+have\s+a\s+chance,\s+could\s+you|If\s+possible,\s+could\s+you|Would\s+you\s+be\s+able\s+to|Could\s+you\s+possibly)\s+)([^\n]+?)([.!?])(?=\s+[A-Z]|\s*$|\n)/g;

  const revised = String(text).replace(
    pattern,
    (match, boundary, frame, action, punctuation) => {
      const replacement = `Please ${action.trim()}${punctuation}`;

      pendingVerifiedEdits.push({
        before: `${frame}${action}${punctuation}`,
        after: replacement,
        ruleId,
        change
      });

      return `${boundary}${replacement}`;
    }
  );

  return { text: revised, pendingVerifiedEdits };
}

function rewriteSecondDraftNotificationFrames(text) {
  const edits = [];
  const changes = [];
  const ruleMatches = [];
  const change = "Rewrote a notification frame into the main statement";
  const ruleId = "SD-CLARITY-001";
  let count = 0;

  const pattern =
    /(^|[.!?]\s+|\n+)((?:We|I)\s+(?:(?:are|am)\s+(?:writing|reaching out)|wanted|want)\s+to\s+let\s+you\s+know\s+that\s+)([^\n]+?)([.!?])(?=\s+[A-Z]|\s*$)/g;

  const revised = String(text).replace(pattern, (match, boundary, frame, clause, punctuation) => {
    const replacement = ensureSecondDraftSentence(
      capitalizeSecondDraftSentence(clause.trim()) + punctuation
    );

    count++;
    edits.push({
      before: `${frame}${clause}${punctuation}`,
      after: replacement,
      ruleId
    });

    return `${boundary}${replacement}`;
  });

  if (count > 0) {
    changes.push(change);
    pushSecondDraftRuleMatch(ruleMatches, ruleId, change);
  }

  return { text: revised, edits, changes, ruleMatches };
}

function applySecondDraftPhraseRules(text, tone) {
  let revised = text;
  const edits = [];
  const changes = [];
  const ruleMatches = [];

  const rules = [
    ["It is important to note that", "", "Removed unnecessary opening phrase"],
    ["due to the fact that", "because", "Simplified wordy phrasing", "SD-COMPRESSION-001"],
    ["in order to", "to", "Simplified wordy phrasing", "SD-COMPRESSION-001"],
    ["for the purpose of", "to", "Simplified wordy phrasing", "SD-COMPRESSION-001"],
    ["At this point in time", "Now", "Simplified time phrasing", "SD-COMPRESSION-001"],
    ["at this point in time", "now", "Simplified time phrasing", "SD-COMPRESSION-001"],
    ["currently in the process of", "currently", "Simplified process wording", "SD-COMPRESSION-001"],
    ["in the process of", "", "Removed wordy process phrasing", "SD-COMPRESSION-001"],
    ["quickly reach out", "reach out", "Simplified wording"],
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

  rules.forEach(([before, after, change, ruleId]) => {
    const result = replaceSecondDraftPhraseWithEdit(revised, before, after, ruleId);
    revised = result.text;

    if (result.count > 0) {
      changes.push(change);
      edits.push(...result.edits);
      pushSecondDraftRuleMatch(ruleMatches, ruleId, change);
    }
  });

  return { text: revised, edits, changes, ruleMatches };
}

function applySecondDraftLengthRules(text, length) {
  const changes = [];
  const edits = [];
  const ruleMatches = [];
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

    const fillerText = revised;
    const redundancyResult = reduceSecondDraftExactRedundancy(revised);
    revised = redundancyResult.text;
    edits.push(...redundancyResult.edits);

    if (redundancyResult.edits.length > 0) {
      const change = "Removed repeated sentences to make the draft shorter";
      changes.push(change);
      pushSecondDraftRuleMatch(
        ruleMatches,
        "SD-REPETITION-002",
        change
      );
    }

    if (revised !== beforeText) {
      changes.push("Tightened wording to make the draft shorter");

      if (fillerText !== beforeText) {
        edits.push({
          before: "Wordier phrasing",
          after: "Shorter phrasing"
        });
      }
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

  return { text: revised, edits, changes, ruleMatches };
}

function reduceSecondDraftExactRedundancy(text) {
  const seen = new Set();
  const edits = [];
  const sentences = String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const kept = [];

  sentences.forEach((sentence) => {
    const clean = sentence.trim();
    const words = clean.match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g) || [];
    const key = words.join(" ").toLowerCase();
    const isEligible =
      /[.!?]$/.test(clean) &&
      words.length >= 5 &&
      !/^(?:[-*•]|\d+[.)])\s/.test(clean);

    if (isEligible && seen.has(key)) {
      edits.push({
        before: clean,
        after: "[removed repeated sentence]",
        ruleId: "SD-REPETITION-002"
      });
      return;
    }

    if (isEligible) seen.add(key);
    kept.push(clean);
  });

  return {
    text: kept.join(" "),
    edits
  };
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

function replaceSecondDraftPhraseWithEdit(text, before, after, ruleId) {
  const edits = [];
  const pattern = new RegExp(`\\b${escapeSecondDraftRegExp(before)}\\b`, "g");

  let count = 0;

  const updated = text.replace(pattern, (match) => {
    count++;

    edits.push({
      before: match,
      after: after || "[removed]",
      ruleId
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
  return getSecondDraftParagraphs(text)
    .map(cleanupSecondDraftParagraphFlow)
    .join("\n\n")
    .trim();
}

function cleanupSecondDraftParagraphFlow(text) {
  return String(text)
    .replace(/\band It\b/g, ". It")
    .replace(/\band it\b/g, ". It")
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*,/g, ".")
    .replace(/([.!?])\1+/g, "$1")
    .replace(
      /,\s+(and|but)\s+(Also|The|This|That|It|There|We|Make|Review|Send)\b/g,
      (match, connector, word) => `, ${connector} ${word.toLowerCase()}`
    )
    .replace(
      /\b(Also),\s+(The|This|That|It|There|We)\b/g,
      (match, opener, word) => `${opener}, ${word.toLowerCase()}`
    )
    .replace(/\s+\./g, ".")
    .replace(/\.\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSecondDraftText(text) {
  return String(text)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*,/g, ".")
    .replace(/([.!?])\1+/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*,/g, ".")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(^|[.!?]\s+)([a-z])/g, (match, start, letter) => {
      return start + letter.toUpperCase();
    })
    .trim();
}

function ensureSecondDraftSentence(text) {
  const clean = cleanupSecondDraftSentenceFlow(text);

  if (!clean) return "";
  if (/[.!?]$/.test(clean)) return clean;

  return `${clean}.`;
}

function getSecondDraftParagraphs(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function hasSecondDraftParagraphStructureChanged(before, after) {
  const beforeParagraphs = getSecondDraftParagraphs(before);
  const afterParagraphs = getSecondDraftParagraphs(after);

  return beforeParagraphs.length !== afterParagraphs.length;
}

function capitalizeSecondDraftSentence(text) {
  const clean = String(text || "").trim();

  if (!clean) return "";

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function makeSecondDraftDirectAction(clause) {
  const clean = String(clause || "").trim();

  const reviewMatch = clean.match(/^we should(?: probably)? take a look at\s+(.+)$/i);
  if (reviewMatch) {
    return `Review ${reviewMatch[1].trim()}`;
  }

  const sendMatch = clean.match(/^we should(?: probably)? send\s+(.+)$/i);
  if (sendMatch) {
    return `Send ${sendMatch[1].trim()}`;
  }

  return capitalizeSecondDraftSentence(
    clean
      .replace(/\ba little\s+/i, "")
      .replace(/^we should(?: probably)?\s+/i, "")
      .replace(/^we can\s+/i, "")
  );
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
            <div class="edit-proof-block">
              <span class="edit-label">Before</span>
              <p class="edit-before">${escapeSecondDraftHTML(edit.before)}</p>
            </div>
            <div class="edit-proof-block">
              <span class="edit-label">After</span>
              <p class="edit-after">${escapeSecondDraftHTML(edit.after)}</p>
            </div>
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
  els.outputPanel?.classList.remove("is-active-result");

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

function pushSecondDraftRuleMatch(matches, ruleId, change) {
  if (!ruleId) return;

  matches.push({
    ruleId,
    change
  });
}

function uniqueSecondDraftRuleMatches(matches) {
  const seen = new Set();

  return matches.filter((match) => {
    if (!match || !match.ruleId) return false;

    const key = `${match.ruleId}|${match.change || ""}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
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
