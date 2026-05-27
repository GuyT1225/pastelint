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
  function removeHiddenCharacters(text, changes) {
    const before = text;
    const after = text
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ");

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

  function normalizePunctuationSpacing(text, changes) {
    const before = text;
    let after = text;

    after = after.replace(/[ \t]+([,.!?;:])/g, "$1");
    after = after.replace(/([,.!?;:])([A-Za-z0-9])/g, "$1 $2");

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
     console.log("PasteLintCleanEngine active");
     
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

  window.PasteLintCleanEngine = {
    cleanText,
    normalizeDbNumbers,
    normalizeSymbolsForSpeech
  };
})();
