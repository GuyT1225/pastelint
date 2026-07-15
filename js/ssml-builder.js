const CHARACTER_LIMIT = 3000;
const MAX_AUTO_TEXTAREA_HEIGHT = 640;
let latestChunks = [];

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("input")?.addEventListener("input", updateCounters);
  document.getElementById("cleanOutput")?.addEventListener("input", handleCleanEdit);
  document.getElementById("ssmlOutput")?.addEventListener("input", updateCounters);

  document.getElementById("cleanTextBtn")?.addEventListener("click", cleanOnly);
  document.getElementById("generateSsmlBtn")?.addEventListener("click", generateSsmlOnly);
  document.getElementById("cleanGenerateBtn")?.addEventListener("click", cleanAndGenerate);

  document.getElementById("autoChunkBtn")?.addEventListener("click", function () {
    generateChunks(false);
  });

  document.getElementById("exportChunksBtn")?.addEventListener("click", exportChunksZip);
  document.getElementById("clearSsmlBtn")?.addEventListener("click", clearAll);
  document.getElementById("generateFromCleanBtn")?.addEventListener("click", generateSsmlFromCleanedText);

  document.getElementById("editCleanBtn")?.addEventListener("click", function () {
    toggleEdit("cleanOutput", this);
  });

  document.getElementById("copyCleanBtn")?.addEventListener("click", function () {
    copyText("cleanOutput");
  });

  document.getElementById("readCleanBtn")?.addEventListener("click", function () {
    speakTextById("cleanOutput");
  });

  document.getElementById("stopReadingBtn")?.addEventListener("click", stopSpeaking);

  document.getElementById("editSsmlBtn")?.addEventListener("click", function () {
    toggleEdit("ssmlOutput", this);
  });

  document.getElementById("copySsmlBtn")?.addEventListener("click", function () {
    copyText("ssmlOutput");
  });

  updateCounters();
});

function resizeAllTextareas() {
  document.querySelectorAll(".ssml-builder-page textarea").forEach(function (textarea) {
    resizeTextareaToContent(textarea);
  });
}

function resizeTextareaToContent(textarea) {
  if (!textarea) return;

  textarea.style.height = "auto";

  const nextHeight = Math.min(textarea.scrollHeight, MAX_AUTO_TEXTAREA_HEIGHT);

  textarea.style.height = nextHeight + "px";
  textarea.style.overflowY =
    textarea.scrollHeight > MAX_AUTO_TEXTAREA_HEIGHT ? "auto" : "hidden";
}

function getFooterText() {
  const type = document.getElementById("footerType").value;

  if (type === "calendar") {
    return "\n\nTo go back to the previous section, press 4. To go to the next section, press 6. To repeat calendar categories, press 8. To return to the main menu, press 9.";
  }

  if (type === "highlights") {
    return "\n\nTo repeat the highlights of the week, press 1. To go to our full calendar section, press 8. To return to the main menu, press 9.";
  }

  if (type === "story") {
    return "\n\nPress 1 to repeat this title. Press 2 for the next title. Press 3 for the description. Press 4 for the previous title. Press 8 to return to the book list menu. Press 9 to return to the main menu.";
  }

  return "";
}

function normalizeMojibakePunctuation(text) {
  return String(text || "")
    .replace(/([A-Za-z])\?\s*\?\s*\?([A-Za-z])/g, "$1'$2")
    .replace(/\?\s*\?\s*\?/g, "-")
    .replace(/\?\s*\?(?=\s)/g, "")
    .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2/g, "'")
    .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u0153/g, "-")
    .replace(/\u00c3\u201a\u00c2\u00ae/g, "")
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u02dc/g, "'")
    .replace(/\u00e2\u20ac\u0153/g, '"')
    .replace(/\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac\u201c/g, "-")
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/\u00c2\u00ae/g, "")
    .replace(/\u00c2\u00a9/g, "");
}

function removeLegalSymbols(text) {
  return text.replace(/[®™©℠]/g, "");
}

function formatSpeechSegment(segment) {
  const normalized = String(segment || "").toLowerCase();
  const knownAcronyms = new Set(["otbs", "rhpl", "www"]);

  if (knownAcronyms.has(normalized) || /^[A-Z]{2,5}$/.test(segment)) {
    return normalized.toUpperCase().split("").join(" ");
  }

  return normalized;
}

function formatSpeechDomain(domain) {
  return String(domain || "")
    .split(".")
    .map(formatSpeechSegment)
    .join(" dot ");
}

function formatSpeechEmailLocal(localPart) {
  const normalized = String(localPart || "").toLowerCase();

  if (/^[a-z]{2,5}$/i.test(localPart) && ["otbs", "rhpl"].includes(normalized)) {
    return normalized.toUpperCase().split("").join(" ");
  }

  return normalized;
}

function repairContactBoundaries(text) {
  return text.replace(
    /\b(dot\s+(?:org|com|net|edu|gov))\s+(call us|email us|thank you|for more information)\b/gi,
    function (_, ending, nextPhrase) {
      return ending.toLowerCase() + ". " +
        nextPhrase.charAt(0).toUpperCase() +
        nextPhrase.slice(1).toLowerCase();
    }
  );
}

function normalizeContactInfoForSpeech(text) {
  let normalized = String(text || "");

  normalized = normalized.replace(
    /\b([A-Z0-9._%+-]+)@((?:[A-Z0-9-]+\.)+(?:org|com|net|edu|gov))\b/gi,
    function (_, localPart, domain) {
      return formatSpeechEmailLocal(localPart) + " at " + formatSpeechDomain(domain);
    }
  );

  normalized = normalized.replace(
    /\b((?:[A-Z0-9-]+\.)+(?:org|com|net|edu|gov))\b/gi,
    function (_, domain) {
      return formatSpeechDomain(domain);
    }
  );

  return repairContactBoundaries(normalized);
}

function fixSpecialCharacters(text) {
  return normalizeContactInfoForSpeech(removeLegalSymbols(normalizeMojibakePunctuation(text)))
    .replace(/&/g, " and ")
    .replace(/@/g, " at ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\//g, " ")
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/\$/g, " dollars ")
    .replace(/%/g, " percent ");
}

function removeProblemCharacters(text) {
  return text
    .replace(/[<>]/g, "")
    .replace(/[{}[\]|\\^~`]/g, "");
}

function formatDBs(text) {
  return text.replace(/\bDB\s?(\d[\d-]*)\b/gi, function (match, digits) {
    const cleanDigits = digits.replace(/-/g, "");
    if (cleanDigits.length < 6) return match;
    return "DB " + cleanDigits.split("").join("-");
  });
}

function fixReadBy(text) {
  return text
    .replace(/\s+read by\s+/gi, ". Read by ")
    .replace(/\.\s*\.\s*Read by/gi, ". Read by");
}

function normalizeScriptLineContinuations(text) {
  return normalizeMojibakePunctuation(text)
    .replace(
      /\b(call(?:\s+[A-Z][a-z]+)?\s+at|call)\s*\n+\s*([0-9(][0-9()\s-]{6,}[0-9]\.?)/gi,
      "$1 $2"
    )
    .replace(
      /\b(\d{1,2}\s*[ap]\.m\.)\s*[-\u2013\u2014]\s*(\d{1,2}:?\d*\s*[ap]\.m\.)/gi,
      "$1 to $2"
    );
}

function hasTerminalPunctuation(text) {
  return /[:;?!.]$/.test(text.trim());
}

function formatHeading(line) {
  const heading = normalizeContactInfoForSpeech(removeLegalSymbols(line))
    .trim()
    .replace(/,+$/, "");
  return hasTerminalPunctuation(heading) ? heading : heading + ".";
}

function looksLikeHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/\bDB\s?\d/i.test(trimmed)) return false;
  return trimmed.length < 90;
}

function splitRawIntoBookUnits(rawText) {
  const lines = normalizeScriptLineContinuations(rawText)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map(function (line) {
      return line.trim();
    })
    .filter(Boolean);

  const units = [];
  let pendingHeadings = [];

  lines.forEach(function (line) {
    const hasDb = /\bDB\s?\d{6}\b/i.test(line) || /\bDB\s?\d(?:[- ]?\d){5}\b/i.test(line);

    if (looksLikeHeading(line)) {
      pendingHeadings.push(formatHeading(line));
      return;
    }

    if (hasDb) {
      if (pendingHeadings.length) {
        units.push({
          type: "headings",
          text: pendingHeadings.join("\n")
        });
        pendingHeadings = [];
      }

      units.push({
        type: "book",
        text: line
      });

      return;
    }

    if (pendingHeadings.length) {
      units.push({
        type: "headings",
        text: pendingHeadings.join("\n")
      });
      pendingHeadings = [];

      units.push({
        type: "text",
        text: line
      });
      return;
    }

    if (units.length && units[units.length - 1].type === "book") {
      units[units.length - 1].text += " " + line;
    } else {
      pendingHeadings.push(formatHeading(line));
    }
  });

  if (pendingHeadings.length) {
    units.push({
      type: "headings",
      text: pendingHeadings.join("\n")
    });
  }

  return units;
}

function fixPauseArtifacts(text) {
  return text
    .replace(/([a-z0-9])\.\s+(until|and|or|didn't|doesn't|can't|couldn't|wouldn't|if|when|while|at|maybe|a)\b/gi, "$1 ... $2");
}

function formatTalkingBookEntry(text) {
  text = text
    .trim()
    .replace(/\bDB\s?(\d{6})\b/gi, function (_, digits) {
      return "DB " + digits.split("").join("-");
    });

  const pattern =
    /^(.+?)\s*,?\s+DB\s?(\d[\d-]*)\s+(\d+)\s+hours?\s+(\d+)\s+minutes?\s+by\s+(.+?)\.\s*Read by\s+([A-Za-z.\s]+?)\s+"([^"]+)"\s*[-–—]\s*From\s+(publisher|Goodreads|WorldCat)\.\s*(.+?)\s+DB\s?(\d[\d-]*)\s+(.+?)\.?$/is;

  if (!pattern.test(text)) {
    return cleanSpacing(text);
  }

  return text.replace(
    pattern,
    function (
      match,
      title,
      dbDigits,
      hours,
      minutes,
      authors,
      narrator,
      description,
      sourceLabel,
      ending,
      endingDb,
      endingTitle
    ) {
      const formattedDB = "DB " + dbDigits.replace(/-/g, "").split("").join("-");

      title = title.trim().replace(/[.,]+$/, "");

      description = fixPauseArtifacts(
        description
          .trim()
          .replace(/^["“]\s*/, "")
          .replace(/([a-z])"([a-z])/gi, '$1 "$2')
          .replace(/\s*"\s*-\s*$/g, '"')
          .replace(/\s*["”]\s*$/, "")
          .replace(/\s+([.!?])$/g, "$1")
          .replace(/\s+\.\.\./g, " ...")
          .replace(/([a-z0-9])\.\s+but\b/g, "$1. But")
      );

      ending = ending.trim().replace(/\.$/, "");
      endingTitle = endingTitle.trim().replace(/[.,]+$/, "");

      return (
        title + ", " +
        formattedDB + ". " +
        hours + " hours, " + minutes + " minutes, by " +
        authors.trim().replace(/[.,]+$/, "") + ". Read by " +
        narrator.trim().replace(/[.,]+$/, "") + '. "' +
        description.trim() + '"\n\nFrom ' + sourceLabel + '. ' +
        ending.trim().replace(/\.$/, "") + ". " +
        formattedDB + ". " +
        endingTitle.trim().replace(/[.,]+$/, "") + "."
      );
    }
  );
}

function cleanSpacing(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\b(\d{1,2}\s*[ap]\.m\.)\s*[-\u2013\u2014]\s*(\d{1,2}:?\s*\d*\s*[ap]\.m\.)/gi, "$1 to $2")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([.,!?;:)])/g, "$1")
    .replace(/([,!?])(?=\S)/g, "$1 ")
    .replace(/([:;])(?=\S)/g, "$1 ")
    .replace(/\b(by\s+[^.\n,;:!?]+?)([,.:;!?]?)\s+DB\s?(\d[\d-]*)\b/gi, function (_, lead, punctuation, digits) {
      return lead + (punctuation || ",") + " DB " + digits;
    })
    .replace(/\.(?=\S)/g, function (match, offset, source) {
      const previous = source.charAt(offset - 1);
      const next = source.charAt(offset + 1);
      const isDottedToken =
        (/\d/.test(previous) && /\d/.test(next)) ||
        (/[a-z]/.test(previous) && /[a-z]/.test(next)) ||
        (/[A-Z]/.test(previous) && /[A-Z]/.test(next));

      return isDottedToken ? "." : ". ";
    })
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+([:;)])/g, "$1")
    .replace(/\.\s+,/g, ".,")
    .replace(/(\d{1,2}):\s+(\d{2}\s*[ap]\.m\.)/gi, "$1:$2")
    .replace(/\b(\d{1,2}\s*[ap]\.m\.)\s*[-\u2013\u2014]\s*(\d{1,2}:?\d*\s*[ap]\.m\.)/gi, "$1 to $2")
    .replace(/(\d+)\s+hours?\s*,?\s*(\d+)\s+minutes?/gi, "$1 hours, $2 minutes")
    .replace(/\bDB\s?(\d{6})\b/gi, function (match, digits) {
      return "DB " + digits.split("").join("-");
    })
    .replace(/\bDB\s?(\d[\d-]*)\./gi, function (match, digits) {
      return "DB " + digits.replace(/-/g, "").split("").join("-") + ".";
    })
    .replace(/Leader Dogs For the Blind/g, "Leader Dogs for the Blind")
    .replace(/([a-z0-9])\.\s+but\b/g, "$1. But")
    .replace(/([A-Za-z0-9])$/g, "$1.")
    .trim();
}

function cleanText(text) {
  text = fixSpecialCharacters(text);
  text = removeProblemCharacters(text);
  text = fixReadBy(text);
  text = formatTalkingBookEntry(text);
  text = formatDBs(text);
  text = cleanSpacing(text);
  return text;
}

function buildFullCleanText() {
  const sectionTitle = document.getElementById("sectionTitle").value.trim();
  const rawText = document.getElementById("input").value || "";

  const units = splitRawIntoBookUnits(rawText);
  const cleanedParts = [];

  units.forEach(function (unit) {
    if (unit.type === "headings") {
      cleanedParts.push(unit.text);
    }

    if (unit.type === "book") {
      cleanedParts.push(cleanText(unit.text));
    }

    if (unit.type === "text") {
      cleanedParts.push(cleanText(unit.text));
    }
  });

  let cleaned = cleanedParts.join("\n\n");

  if (sectionTitle) {
    cleaned = formatHeading(sectionTitle) + "\n\n" + cleaned;
  }

  cleaned += getFooterText();

  return cleanSpacing(cleaned);
}

function escapeForSSML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapSSML(text) {
  return `<speak>
  <prosody rate="94%">
${escapeForSSML(text)}
  </prosody>
</speak>`;
}

function setSsmlStatus(message) {
  const status = document.getElementById("ssmlStatus");
  if (!status) return;

  status.textContent = message;
  status.hidden = !message;
}

function cleanOnly() {
  const cleaned = buildFullCleanText();

  document.getElementById("cleanOutput").value = cleaned;

  updateCounters();
  setSsmlStatus("Cleaned text ready. Review it before generating SSML.");

  return cleaned;
}

function getSsmlSourceText() {
  const cleaned = document.getElementById("cleanOutput").value || "";
  const raw = document.getElementById("input").value || "";

  return cleaned.trim() ? cleaned : raw;
}

function generateSsmlFromText(text) {
  if (!text.trim()) {
    setSsmlStatus("Nothing to generate yet.");
    return;
  }

  document.getElementById("ssmlOutput").value = wrapSSML(text);

  updateCounters();
  setSsmlStatus("SSML generated. Review before final Polly audio.");
}

function generateSsmlOnly() {
  const sourceText = getSsmlSourceText();

  generateSsmlFromText(sourceText);
}

function generateSsmlFromCleanedText() {
  const cleaned = document.getElementById("cleanOutput")?.value || "";

  if (!cleaned.trim()) {
    setSsmlStatus("Nothing to generate yet.");
    return;
  }

  generateSsmlFromText(cleaned);
  setSsmlStatus("SSML generated from cleaned text. Review before final Polly audio.");
}

function cleanAndGenerate() {
  const raw = document.getElementById("input").value || "";

  if (raw.length > CHARACTER_LIMIT) {
    generateChunks(true);
    return;
  }

  const cleaned = cleanOnly();

  if (!cleaned.trim()) return;

  generateSsmlFromText(cleaned);
}

function handleCleanEdit() {
  updateCounters();
}

function splitIntoSentences(text) {
  return text.match(/[^.!?]+[.!?]+|\S.+$/g) || [text];
}

function splitLongText(text, limit) {
  const sentences = splitIntoSentences(text);
  const chunks = [];
  let current = "";

  sentences.forEach(function (sentence) {
    const trimmed = sentence.trim();

    if ((current + " " + trimmed).trim().length <= limit) {
      current = (current + " " + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      current = trimmed;
    }
  });

  if (current) chunks.push(current);

  return chunks;
}

function splitIntoBookAwareUnits(text) {
  const blocks = text
    .split(/\n\s*\n+/)
    .map(function (block) {
      return block.trim();
    })
    .filter(Boolean);

  const units = [];
  let current = "";

  blocks.forEach(function (block) {
    const startsBook = /\bDB\s?\d/i.test(block);

    if (startsBook) {
      if (current) {
        units.push(current);
      }

      current = block;
      return;
    }

    if (block.length < 90 && !/\bDB\s?\d/i.test(block)) {
      if (current) {
        units.push(current);
      }

      units.push(block);
      current = "";
      return;
    }

    if (current) {
      current += "\n\n" + block;
    } else {
      current = block;
    }
  });

  if (current) {
    units.push(current);
  }

  return units;
}

function splitIntoBookAwareChunks(text, limit) {
  const units = splitIntoBookAwareUnits(text);
  const chunks = [];
  let current = "";
  let pendingHeading = "";

  function isStandaloneHeading(text) {
    return /^[A-Z][A-Za-z0-9 and,&'’:-]{2,80}\.$/.test(text.trim()) && !/\bDB\s?\d/i.test(text);
  }

  function pushCurrentChunk() {
    if (!current.trim()) return;

    const parts = current
      .split(/\n\s*\n+/)
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean);

    const lastPart = parts[parts.length - 1];

    if (lastPart && isStandaloneHeading(lastPart) && parts.length > 1) {
      pendingHeading = lastPart;
      parts.pop();
      current = parts.join("\n\n").trim();
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    current = "";
  }

  units.forEach(function (unit) {
    if (pendingHeading) {
      unit = pendingHeading + "\n\n" + unit;
      pendingHeading = "";
    }

    const candidate = current ? current + "\n\n" + unit : unit;

    if (candidate.length <= limit) {
      current = candidate;
      return;
    }

    pushCurrentChunk();

    if (unit.length <= limit) {
      current = unit;
    } else {
      splitLongText(unit, limit).forEach(function (part) {
        if (part.length <= limit) {
          chunks.push(part);
        }
      });
    }
  });

  pushCurrentChunk();

  if (pendingHeading) {
    chunks.push(pendingHeading);
  }

  return chunks;
}

function generateChunks(wasRedirected) {
  const cleaned = buildFullCleanText();
  const chunks = splitIntoBookAwareChunks(cleaned, CHARACTER_LIMIT);

  latestChunks = chunks.slice();

  const container = document.getElementById("chunksContainer");
  const summary = document.getElementById("chunkSummary");

  container.innerHTML = "";

  summary.textContent = "Created " + chunks.length + " book-aware chunks. Review each part before generating final Polly audio.";
  summary.classList.add("show");

  chunks.forEach(function (chunk, index) {
    const title = document.getElementById("sectionTitle").value.trim() || "IVR Section";
    const chunkTitle = chunks.length > 1
      ? title + " - Part " + (index + 1) + " of " + chunks.length
      : title;

    const ssml = wrapSSML(chunk);

    const div = document.createElement("div");
    div.className = "chunk chunk-card";

    div.innerHTML = `
      <h3>${chunkTitle}</h3>
      <div class="counter">${chunk.length} / ${CHARACTER_LIMIT} characters</div>
      <textarea readonly id="chunkText${index}">${chunk}</textarea>
      <div class="controls control-panel">
        <button class="secondary-btn" type="button" data-copy-target="chunkText${index}">Copy Chunk Text</button>
        <button class="secondary-btn" type="button" data-read-target="chunkText${index}">Read This Chunk</button>
        <button class="secondary-btn" type="button" data-stop-reading="true">Stop Reading</button>
      </div>
      <textarea readonly id="chunkSSML${index}">${ssml}</textarea>
      <div class="controls control-panel">
        <button class="secondary-btn" type="button" data-copy-target="chunkSSML${index}">Copy Chunk SSML</button>
      </div>
    `;

    container.appendChild(div);
  });

  container.querySelectorAll("[data-copy-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.dataset.copyTarget);
    });
  });

  container.querySelectorAll("[data-read-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      speakTextById(button.dataset.readTarget);
    });
  });

  container.querySelectorAll("[data-stop-reading]").forEach(function (button) {
    button.addEventListener("click", stopSpeaking);
  });

  const cleanedPrefix = wasRedirected
    ? "[Auto Chunk applied due to large input. Use the chunked sections below for final Polly generation.]\n\n"
    : "";

  document.getElementById("cleanOutput").value = cleanedPrefix + cleaned;
  document.getElementById("ssmlOutput").value = wrapSSML(cleaned);

  updateCounters();
  resizeAllTextareas();
  if (chunks.length) {
    setSsmlStatus("Chunks created. Review each part before final Polly audio.");
  } else {
    setSsmlStatus("Nothing to chunk yet.");
  }

  document.getElementById("chunkStart").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function updateCounters() {
  updateCounter("input", "inputCounter", "inputWarning");
  updateCounter("cleanOutput", "cleanCounter", "cleanWarning");
  updateCounter("ssmlOutput", "ssmlCounter", "ssmlWarning");
  updateLargeInputButtons();
}

function updateCounter(textareaId, counterId, warningId) {
  const textarea = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  const warning = document.getElementById(warningId);

  if (!textarea || !counter) return;

  const count = textarea.value.length;
  const isOverLimit = count > CHARACTER_LIMIT;

  counter.textContent = `${count} / ${CHARACTER_LIMIT} characters`;
  counter.classList.toggle("over-limit", isOverLimit);

  resizeTextareaToContent(textarea);

  if (warning) {
    warning.hidden = !isOverLimit;
    warning.classList.toggle("show", isOverLimit);
  }
}

function updateLargeInputButtons() {
  const raw = document.getElementById("input")?.value || "";
  const cleanGenerateBtn = document.getElementById("cleanGenerateBtn");
  const chunkBtn = document.getElementById("autoChunkBtn");

  if (raw.length > CHARACTER_LIMIT) {
    cleanGenerateBtn?.classList.add("primary-warning");
    chunkBtn?.classList.add("chunk-emphasis");
  } else {
    cleanGenerateBtn?.classList.remove("primary-warning");
    chunkBtn?.classList.remove("chunk-emphasis");
  }
}

function toggleEdit(id, button) {
  const textarea = document.getElementById(id);

  if (textarea.hasAttribute("readonly")) {
    textarea.removeAttribute("readonly");
    textarea.focus();
    button.textContent = "Lock " + (id === "cleanOutput" ? "Cleaned Text" : "SSML");
  } else {
    textarea.setAttribute("readonly", true);
    button.textContent = id === "cleanOutput" ? "Edit Cleaned Text" : "Edit SSML";
  }
}

function copyText(id) {
  const box = document.getElementById(id);
  if (!box) return;

  if (!box.value.trim()) {
    setSsmlStatus("Nothing to copy yet.");
    return;
  }

  box.select();
  box.setSelectionRange(0, 999999);

  const confirmCopied = function () {
    setSsmlStatus("Copied to clipboard.");
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(box.value).then(confirmCopied).catch(function () {
      document.execCommand("copy");
      confirmCopied();
    });
  } else {
    document.execCommand("copy");
    confirmCopied();
  }
}

function speakTextById(id) {
  const box = document.getElementById(id);
  if (!box) return;

  const text = box.value;

  if (!text.trim()) {
    setSsmlStatus("Nothing to read yet.");
    return;
  }

  window.speechSynthesis.cancel();

  const mode = document.getElementById("previewMode").value;
  const speech = new SpeechSynthesisUtterance(text);

  speech.rate = mode === "ivr" ? 0.82 : 0.94;
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
}

function sanitizeFilename(text) {
  return (text || "ivr_section")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50) || "ivr_section";
}

function downloadBlob(filename, blob) {
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(link.href);
}

function crc32(str) {
  const table = crc32.table || (crc32.table = function () {
    let c;
    const table = [];

    for (let n = 0; n < 256; n++) {
      c = n;

      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }

      table[n] = c >>> 0;
    }

    return table;
  }());

  let crc = 0 ^ (-1);

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  return (crc ^ (-1)) >>> 0;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  function pushUint16(arr, value) {
    arr.push(value & 0xff, (value >>> 8) & 0xff);
  }

  function pushUint32(arr, value) {
    arr.push(
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff
    );
  }

  files.forEach(function (file) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(file.content);
    const local = [];

    pushUint32(local, 0x04034b50);
    pushUint16(local, 20);
    pushUint16(local, 0);
    pushUint16(local, 0);
    pushUint16(local, 0);
    pushUint16(local, 0);
    pushUint32(local, crc);
    pushUint32(local, dataBytes.length);
    pushUint32(local, dataBytes.length);
    pushUint16(local, nameBytes.length);
    pushUint16(local, 0);

    const localHeader = new Uint8Array(local);

    localParts.push(localHeader, nameBytes, dataBytes);

    const central = [];

    pushUint32(central, 0x02014b50);
    pushUint16(central, 20);
    pushUint16(central, 20);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint32(central, crc);
    pushUint32(central, dataBytes.length);
    pushUint32(central, dataBytes.length);
    pushUint16(central, nameBytes.length);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint32(central, 0);
    pushUint32(central, offset);

    centralParts.push(new Uint8Array(central), nameBytes);

    offset += localHeader.length + nameBytes.length + dataBytes.length;
  });

  const centralOffset = offset;
  let centralSize = 0;

  centralParts.forEach(function (part) {
    centralSize += part.length;
  });

  const end = [];

  pushUint32(end, 0x06054b50);
  pushUint16(end, 0);
  pushUint16(end, 0);
  pushUint16(end, files.length);
  pushUint16(end, files.length);
  pushUint32(end, centralSize);
  pushUint32(end, centralOffset);
  pushUint16(end, 0);

  return new Blob(localParts.concat(centralParts, [new Uint8Array(end)]), {
    type: "application/zip"
  });
}

function exportChunksZip() {
  if (!latestChunks.length) {
    generateChunks(false);
  }

  if (!latestChunks.length) {
    setSsmlStatus("Nothing to export yet.");
    return;
  }

  const title = sanitizeFilename(
    document.getElementById("sectionTitle").value.trim() || "ivr_section"
  );

  const files = [];

  latestChunks.forEach(function (chunk, index) {
    const number = String(index + 1).padStart(2, "0");

    files.push({
      name: title + "_part_" + number + ".txt",
      content: chunk
    });

    files.push({
      name: title + "_part_" + number + ".ssml",
      content: wrapSSML(chunk)
    });
  });

  downloadBlob(title + "_chunks.zip", createZip(files));
  setSsmlStatus("Chunks exported.");
}

function clearAll() {
  window.speechSynthesis.cancel();

  document.getElementById("sectionTitle").value = "";
  document.getElementById("footerType").value = "none";
  document.getElementById("previewMode").value = "plain";
  document.getElementById("input").value = "";
  document.getElementById("cleanOutput").value = "";
  document.getElementById("ssmlOutput").value = "";
  document.getElementById("chunksContainer").innerHTML = "";

  latestChunks = [];

  const summary = document.getElementById("chunkSummary");
  summary.textContent = "";
  summary.classList.remove("show");
  setSsmlStatus("");

  updateCounters();
}

