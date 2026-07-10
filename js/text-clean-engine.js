/* PasteLint Text Clean Engine
   Shared cleanup layer.
   No DOM access. No backend. No dependencies.
*/

(function () {
  "use strict";

  function toText(input) {
    return String(input || "");
  }

  function addChange(changes, type, before, after, message) {
    if (before !== after) {
      changes.push({
        type,
        before,
        after,
        message
      });
    }
  }
   
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

function capitalize(text) {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}

function fixCommonTypos(text, changes) {
  const before = text;
  let count = 0;

  const after = String(text).replace(/\b[A-Za-z']+\b/g, word => {
    const lower = word.toLowerCase();
    const replacement = COMMON_TYPOS[lower];

    if (!replacement) return word;

    count++;

    if (word === word.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (word[0] === word[0].toUpperCase()) {
      return capitalize(replacement);
    }

    return replacement;
  });

  if (count > 0) {
    addChange(
      changes,
      "typos",
      before,
      after,
      `Corrected ${count} common typo${count === 1 ? "" : "s"}.`
    );
  }

  return after;
}

function fixRepeatedWords(text, changes) {
  const before = text;
  let count = 0;

  const after = String(text).replace(/\b(\w+)\s+\1\b/gi, (match, word) => {
    count++;
    return word;
  });

  if (count > 0) {
    addChange(
      changes,
      "repeated-words",
      before,
      after,
      `Removed ${count} repeated word${count === 1 ? "" : "s"}.`
    );
  }

  return after;
}
  function getTokenFragmentBefore(text, index) {
    const match = String(text).slice(0, index).match(/[A-Za-z]+$/);
    return match ? match[0] : "";
  }

  function getTokenFragmentAfter(text, index) {
    const match = String(text).slice(index + 1).match(/^[A-Za-z]+/);
    return match ? match[0] : "";
  }

  function isUrlOrEmailBoundary(left, right) {
    return /[@:\/._-]/.test(left) || /[@:\/._-]/.test(right);
  }

  function isPunctuationBoundary(left, right) {
    return /[,.!?;:()[\]{}"'`]/.test(left) || /[,.!?;:()[\]{}"'`]/.test(right);
  }

  function shouldReplaceZeroWidthWithSpace(text, index) {
    const left = text.charAt(index - 1);
    const right = text.charAt(index + 1);

    if (!left || !right) return false;
    if (isUrlOrEmailBoundary(left, right) || isPunctuationBoundary(left, right)) {
      return false;
    }

    if (!/[A-Za-z]/.test(left) || !/[A-Za-z]/.test(right)) {
      return false;
    }

    const before = getTokenFragmentBefore(text, index);
    const after = getTokenFragmentAfter(text, index);

    if (!before || !after) return false;
    if (before.length <= 3 || after.length <= 3) return false;

    return true;
  }

  function normalizeHiddenCharacterSpacing(text) {
    return String(text)
      .replace(/\u00A0/g, " ")
      .replace(/\uFEFF/g, "")
      .replace(/[\u200B-\u200D]/g, function (match, offset, source) {
        return shouldReplaceZeroWidthWithSpace(source, offset) ? " " : "";
      });
  }

  function removeHiddenCharacters(text, changes) {
    const before = text;
    const after = normalizeHiddenCharacterSpacing(text);

    addChange(
      changes,
      "hidden-characters",
      before,
      after,
      "Removed hidden and non-breaking characters."
    );

    return after;
  }

  function normalizeLineEndings(text, changes) {
    const before = text;
    const after = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    addChange(
      changes,
      "line-endings",
      before,
      after,
      "Normalized line endings."
    );

    return after;
  }

  function normalizeQuotes(text, changes) {
    const before = text;
    const after = text
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    addChange(changes, "quotes", before, after, "Normalized smart quotes.");
    return after;
  }

  function normalizeDashes(text, changes) {
    const before = text;
    const after = text
      .replace(/[–—]/g, "-")
      .replace(/[ \t]+-[ \t]+/g, " - ");

    addChange(changes, "dashes", before, after, "Normalized dash characters.");
    return after;
  }

function isLikelyDomainOrEmailPeriod(text, offset) {
  const source = String(text || "");
  const before = source.slice(Math.max(0, offset - 80), offset);
  const after = source.slice(offset + 1, Math.min(source.length, offset + 80));
  const leftToken = before.match(/[A-Za-z0-9@:_/-]+$/)?.[0] || "";
  const rightToken = after.match(/^[A-Za-z0-9_/-]+/)?.[0] || "";

  if (!leftToken || !rightToken) return false;

  const candidate = leftToken + "." + rightToken;

  return (
    candidate.includes("@") ||
    /^https?:\/\//i.test(candidate) ||
    /\b[A-Za-z0-9-]+\.(?:com|org|net|edu|gov|mil|io|co|us|info|biz|dev|app|library)\b/i.test(candidate)
  );
}

 function normalizePunctuationSpacing(text, changes) {
  const before = text;
  let after = text;

  after = after.replace(/[ \t]+([,.!?;:])/g, "$1");

  after = after.replace(/([,.!?;:])([A-Za-z0-9])/g, function (
    match,
    mark,
    next,
    offset,
    fullText
  ) {
    const previous = fullText.charAt(offset - 1);

    // Preserve time-like and number-like patterns:
    // 10:00, 3.14, 1:2, etc.
    if ((mark === ":" || mark === ".") && /\d/.test(previous) && /\d/.test(next)) {
      return match;
    }

    if (
      mark === "." &&
      /[A-Za-z0-9]/.test(previous) &&
      /[A-Za-z0-9]/.test(next) &&
      isLikelyDomainOrEmailPeriod(fullText, offset)
    ) {
      return match;
    }

    return mark + " " + next;
  });

  // Important: only collapse spaces and tabs, not line breaks.
  after = after.replace(/[ \t]{2,}/g, " ");

  addChange(
    changes,
    "punctuation-spacing",
    before,
    after,
    "Repaired spacing around punctuation."
  );

  return after;
}
  function normalizeSpacing(text, changes) {
    const before = text;
    let after = text;

    after = after.replace(/[ \t]+/g, " ");
    after = after.replace(/[ \t]+\n/g, "\n");
    after = after.replace(/\n[ \t]+/g, "\n");
    after = after.replace(/\n{3,}/g, "\n\n");
    after = after.trim();

    addChange(
      changes,
      "spacing",
      before,
      after,
      "Cleaned extra spacing and blank lines."
    );

    return after;
  }

  function normalizeSymbolsForSpeech(text, changes) {
    const before = text;
    let after = text;

    after = after.replace(/&/g, "and");
    after = after.replace(/@/g, " at ");

    addChange(
      changes,
      "speech-symbols",
      before,
      after,
      "Normalized common symbols for spoken output."
    );

    return after;
  }

  function normalizeDbNumbers(text, changes) {
    const before = text;

    const after = text.replace(/\bDB\s*[-:]?\s*(\d{4,})\b/gi, function (_, digits) {
      return "DB " + digits.split("").join("-");
    });

    addChange(
      changes,
      "db-number",
      before,
      after,
      "Normalized DB numbers for clearer text-to-speech."
    );

    return after;
  }

  function cleanText(input, options = {}) {
     
    const changes = [];
    let cleaned = toText(input);

    const settings = {
      normalizeQuotes: options.normalizeQuotes !== false,
      normalizeDashes: options.normalizeDashes !== false,
      normalizeSpeechSymbols: options.normalizeSpeechSymbols === true,
      normalizeDbNumbers: options.normalizeDbNumbers === true
    };

    cleaned = normalizeLineEndings(cleaned, changes);
    cleaned = removeHiddenCharacters(cleaned, changes);

    if (settings.normalizeQuotes) {
      cleaned = normalizeQuotes(cleaned, changes);
    }

    if (settings.normalizeDashes) {
      cleaned = normalizeDashes(cleaned, changes);
    }

    if (settings.normalizeDbNumbers) {
      cleaned = normalizeDbNumbers(cleaned, changes);
    }

    if (settings.normalizeSpeechSymbols) {
      cleaned = normalizeSymbolsForSpeech(cleaned, changes);
    }
     
     cleaned = fixCommonTypos(cleaned, changes);
     cleaned = fixRepeatedWords(cleaned, changes);
     
     cleaned = normalizeSpacing(cleaned, changes);
     cleaned = normalizePunctuationSpacing(cleaned, changes);

    const analyzer = window.PasteLintAnalyzer;
    const analysis =
      analyzer && typeof analyzer.analyzeText === "function"
        ? analyzer.analyzeText(cleaned)
        : null;

    return {
      original: toText(input),
      cleaned,
      changes,
      analysis
    };
  }

function detectCleanupWarnings(input, options = {}) {
  const source = toText(input);
  const warnings = [];

  const speechMode =
    options.normalizeSpeechSymbols === true ||
    options.normalizeDbNumbers === true;

  if (!speechMode && source.includes("&")) {
    warnings.push({
      type: "speech-risk",
      severity: "low",
      text: "&",
      message:
        "Contains an ampersand. For narration, IVR, or screen-reader use, consider replacing it with the word and."
    });
  }

  if (!speechMode && source.includes("@")) {
    warnings.push({
      type: "speech-risk",
      severity: "low",
      text: "@",
      message:
        "Contains an @ symbol. For spoken output, consider replacing it with the word at."
    });
  }

  if (!options.normalizeDbNumbers && /\bDB\s*[-:]?\s*\d{4,}\b/i.test(source)) {
    warnings.push({
      type: "speech-risk",
      severity: "medium",
      text: "DB number",
      message:
        "Contains a compact DB number. For SSML or IVR output, consider spacing the digits for clearer speech."
    });
  }

  if (/[“”‘’]/.test(source)) {
    warnings.push({
      type: "formatting-note",
      severity: "low",
      text: "smart quotes",
      message:
        "Smart quotes were detected. PasteLint can normalize these for cleaner reuse."
    });
  }

  if (/[\u200B-\u200D\uFEFF]/.test(source)) {
    warnings.push({
      type: "formatting-risk",
      severity: "medium",
      text: "hidden characters",
      message:
        "Hidden characters were detected. These can cause strange spacing, copying, or publishing behavior."
    });
  }

  return warnings;
}
function runPasteLintCleanup(input, options = {}) {
  const result = cleanText(input, options);

  const sourceText = result.original;
  const cleanedText = result.cleaned;

  const warnings = detectCleanupWarnings(sourceText, options);

  return {
    sourceText,
    cleanedText,
    changed: cleanedText !== sourceText,

    changes: Array.isArray(result.changes) ? result.changes : [],
    warnings,

    analysis: result.analysis || null,

    meta: {
      engine: "pastelint-clean",
      mode: options.mode || "standard"
    },

    // Backward-compatible aliases.
    original: sourceText,
    cleaned: cleanedText
  };
}
  window.PasteLintCleanEngine = {
    cleanText,
    runPasteLintCleanup,
    normalizeDbNumbers,
    normalizeSymbolsForSpeech
  };
})();
