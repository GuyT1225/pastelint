import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultRegistry = path.join(root, "data", "editorial-demonstrations.json");
const rulesPath = path.join(root, "data", "second-draft-rules.json");
const regressionsPath = path.join(root, "tests", "regression.js");
const qaFixturePath = path.join(
  root,
  "tests",
  "fixtures",
  "editorial-components-demo-001.html"
);
const allowedClassifications = new Set([
  "live-engine",
  "recorded-replay",
  "concept-illustration"
]);
const allowedStatuses = new Set([
  "draft",
  "verified",
  "recheck-required",
  "retired"
]);
const allowedModes = new Set(["compare", "replay"]);
const requiredMethods = new Set([
  "regression",
  "browser-qa",
  "static-fallback-qa",
  "accessibility-qa",
  "privacy-review"
]);
const requiredConceptMethods = new Set([
  "browser-qa",
  "static-fallback-qa",
  "accessibility-qa",
  "privacy-review"
]);
const allowedActions = new Set([
  "replay-start",
  "replay-complete",
  "replay-step",
  "compare-toggle",
  "metadata-open",
  "reset"
]);
const requiredFields = [
  "id",
  "slug",
  "title",
  "classification",
  "status",
  "componentModes",
  "summary",
  "engine",
  "comparison",
  "fixture",
  "steps",
  "rules",
  "regressions",
  "captureDate",
  "lastVerified",
  "verification",
  "limitations",
  "accessibility",
  "analytics",
  "destinations",
  "notes"
];

function normalizeLines(value) {
  return String(value).replace(/\r\n?/g, "\n");
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&middot;/gi, "·")
    .replace(/&nbsp;/gi, " ");
}

function normalizeInline(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value;
}

function getField(html, field, preserveLines = false) {
  const pattern = new RegExp(
    `<([a-z][a-z0-9-]*)\\b[^>]*data-demo-field=["']${field}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    "i"
  );
  const match = html.match(pattern);
  if (!match) return null;
  const decoded = decodeHtml(match[2]);
  return preserveLines
    ? normalizeLines(decoded).replace(/^\n|\n$/g, "")
    : decoded.replace(/\s+/g, " ").trim();
}

function extractFallbackRoot(html, selector) {
  const demoSelector = String(selector).match(
    /^\[data-demo-id=["'](DEMO-\d{3})["']\]$/
  );
  const idSelector = String(selector).match(/^#([A-Za-z][A-Za-z0-9_-]*)$/);
  let attribute;
  let value;
  if (demoSelector) {
    attribute = "data-demo-id";
    value = demoSelector[1];
  } else if (idSelector) {
    attribute = "id";
    value = idSelector[1];
  } else {
    return null;
  }
  const pattern = new RegExp(
    `<([a-z][a-z0-9-]*)\\b[^>]*${attribute}=["']${value}["'][^>]*>[\\s\\S]*?<\\/\\1>`,
    "i"
  );
  return html.match(pattern)?.[0] || null;
}

function expectedFallback(record) {
  if (record.classification === "concept-illustration") {
    return {
      classification: "Concept Illustration · Does not execute PasteLint",
      title: record.title,
      "text-alternative": record.concept.textAlternative,
      ...Object.fromEntries(
        record.concept.fields.map((field) => [field.id, field.value])
      )
    };
  }
  return {
    classification:
      `Recorded Replay · Captured from PasteLint engine commits ` +
      `${record.comparison.versions[0].engineCommit} and ` +
      `${record.comparison.versions[1].engineCommit}`,
    title: record.title,
    source: normalizeLines(record.fixture.input),
    output: normalizeLines(record.fixture.output),
    "previous-output": normalizeLines(record.comparison.versions[0].output),
    preserved: record.reasoning?.preserved,
    changed: record.reasoning?.changed,
    "intentionally-unchanged": record.reasoning?.intentionallyUnchanged
  };
}

function compareFallback(record, html, context, error) {
  const expected = expectedFallback(record);
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (expectedValue === undefined) continue;
    const preserveLines = ["source", "previous-output", "output"].includes(field);
    const found = getField(html, field, preserveLines);
    const normalizedExpected = preserveLines
      ? normalizeLines(expectedValue)
      : normalizeInline(expectedValue);
    if (found === null) {
      error(context, `Missing fallback field: ${field}`);
    } else if (found !== normalizedExpected) {
      error(context, `Fallback drift: ${field}`);
    }
  }
  const limitation = getField(html, "limitation");
  if (!limitation) {
    error(context, "Missing fallback field: limitation");
  } else {
    const matches = record.limitations.some((item) =>
      normalizeInline(limitation).includes(normalizeInline(item))
    );
    if (!matches) error(context, "Fallback drift: limitation");
  }
}

function readJson(file, context, error) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (cause) {
    error(context, `Invalid or missing JSON: ${cause.message}`);
    return null;
  }
}

function gitContains(commit, modulePath) {
  const commitCheck = spawnSync(
    "git",
    ["cat-file", "-e", `${commit}^{commit}`],
    { cwd: root, encoding: "utf8" }
  );
  if (commitCheck.status !== 0) return false;
  const fileCheck = spawnSync(
    "git",
    ["cat-file", "-e", `${commit}:${modulePath}`],
    { cwd: root, encoding: "utf8" }
  );
  return fileCheck.status === 0;
}

function validateRegistryData(registry, options = {}) {
  const errors = [];
  const warnings = [];
  const error = (context, message) => errors.push(`${context}: ${message}`);
  const warning = (context, message) => warnings.push(`${context}: ${message}`);
  const ruleData = options.ruleData || { rules: [] };
  const regressionSource = options.regressionSource || "";
  const rules = new Set((ruleData.rules || []).map((rule) => rule.id));
  const ids = new Set();
  const slugs = new Set();
  let analyticsCount = 0;
  let destinationCount = 0;
  const modeCounts = { compare: 0, replay: 0 };
  const statusCounts = {};
  const classificationCounts = {};

  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    error("registry", "Root must be an object");
    return { errors, warnings };
  }
  if (registry.schemaVersion !== 1) {
    error("registry", `Unsupported schemaVersion: ${registry.schemaVersion}`);
  }
  if (!Array.isArray(registry.demonstrations)) {
    error("registry", "demonstrations must be an array");
    return { errors, warnings };
  }

  for (const record of registry.demonstrations) {
    const context = `demonstration:${record?.id || "unknown"}`;
    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(record || {}, field)) {
        error(context, `Missing required field: ${field}`);
      }
    }
    if (!/^DEMO-\d{3}$/.test(record?.id || "")) {
      error(context, "Invalid demonstration ID");
    } else if (ids.has(record.id)) {
      error(context, "Duplicate demonstration ID");
    }
    ids.add(record?.id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record?.slug || "")) {
      error(context, "Invalid slug");
    } else if (slugs.has(record.slug)) {
      error(context, "Duplicate slug");
    }
    slugs.add(record?.slug);
    if (!String(record?.title || "").trim()) error(context, "Title is required");
    if (!String(record?.summary || "").trim()) error(context, "Summary is required");

    if (!allowedClassifications.has(record?.classification)) {
      error(context, "Unknown classification");
    }
    if (!allowedStatuses.has(record?.status)) error(context, "Unknown status");
    classificationCounts[record?.classification] =
      (classificationCounts[record?.classification] || 0) + 1;
    statusCounts[record?.status] = (statusCounts[record?.status] || 0) + 1;

    if (!Array.isArray(record?.componentModes)) {
      error(context, "componentModes must be an array");
    } else {
      const seenModes = new Set();
      for (const mode of record.componentModes) {
        if (!allowedModes.has(mode)) error(context, `Unknown component mode: ${mode}`);
        if (seenModes.has(mode)) error(context, `Duplicate component mode: ${mode}`);
        seenModes.add(mode);
        if (modeCounts[mode] !== undefined) modeCounts[mode] += 1;
      }
    }

    const verifiedRecord = record?.status === "verified";
    const verifiedReplay =
      record?.status === "verified" &&
      record?.classification === "recorded-replay";
    if (record?.classification === "recorded-replay") {
      if (record?.engine?.adapter !== null) {
        error(context, "Recorded Replay adapter must be null");
      }
      if (verifiedReplay) {
        if (!String(record.engine?.name || "").trim()) error(context, "Engine name is required");
        if (!String(record.engine?.module || "").trim() ||
            !fs.existsSync(path.join(root, record.engine.module))) {
          error(context, "Engine module is missing");
        }
        if (!record.engine?.options ||
            typeof record.engine.options !== "object" ||
            Array.isArray(record.engine.options)) {
          error(context, "Engine options must be an object");
        }
        if (!String(record.fixture?.id || "").trim()) error(context, "Fixture ID is required");
        if (typeof record.fixture?.input !== "string" || !record.fixture.input) {
          error(context, "Verified replay input is required");
        }
        if (typeof record.fixture?.output !== "string" || !record.fixture.output) {
          error(context, "Verified replay output is required");
        }
        if (!validDate(record.captureDate)) error(context, "Invalid captureDate");
        if (!validDate(record.lastVerified)) error(context, "Invalid lastVerified");
      }
    }

    const comparison = record?.comparison;
    if (record?.classification === "recorded-replay" &&
        (!comparison || !Array.isArray(comparison.versions) ||
         comparison.versions.length !== 2)) {
      error(context, "Recorded comparison requires exactly two versions");
    } else if (record?.classification === "recorded-replay") {
      const expectedVersions = [
        ["previous", "Previous engine behavior"],
        ["current", "Current verified behavior"]
      ];
      expectedVersions.forEach(([id, label], index) => {
        const version = comparison.versions[index];
        if (version?.id !== id) error(context, `Invalid comparison version ID: ${id}`);
        if (version?.label !== label) error(context, `Invalid comparison label: ${id}`);
        if (!/^[a-f0-9]{7,40}$/.test(version?.engineCommit || "")) {
          error(context, `Invalid comparison commit: ${id}`);
        } else if (
          !options.skipGit &&
          !gitContains(version.engineCommit, record.engine?.module)
        ) {
          error(context, `Comparison provenance cannot be resolved: ${id}`);
        }
        if (typeof version?.output !== "string" || !version.output) {
          error(context, `Comparison output is required: ${id}`);
        }
      });
      if (
        JSON.stringify(comparison.defaultVersionIds) !==
        JSON.stringify(["previous", "current"])
      ) {
        error(context, "Default Compare versions must be previous and current");
      }
      if (comparison.sourceStepId !== "source") {
        error(context, "Comparison sourceStepId must reference source");
      }
      if (
        comparison.versions[1]?.output !== record?.fixture?.output
      ) {
        error(context, "Current comparison output must equal fixture output");
      }
    }

    if (record?.classification === "concept-illustration") {
      if (record.engine !== null || record.comparison !== null || record.fixture !== null) {
        error(context, "Concept Illustration must not declare engine output");
      }
      if (record.captureDate !== null) {
        error(context, "Concept Illustration captureDate must be null");
      }
      if (!validDate(record.lastVerified)) {
        error(context, "Invalid Concept Illustration lastVerified");
      }
      if (record.componentModes?.length !== 0) {
        error(context, "Concept Illustration does not use Replay or Compare modes");
      }
      if (!record.concept ||
          !["editorial-decision", "destination-readiness"].includes(record.concept.pattern) ||
          !String(record.concept.subject || "").trim() ||
          !String(record.concept.textAlternative || "").trim() ||
          !Array.isArray(record.concept.fields) ||
          record.concept.fields.length === 0) {
        error(context, "Concept Illustration requires a supported pattern and text alternative");
      } else {
        const conceptFieldIds = new Set();
        for (const field of record.concept.fields) {
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(field?.id || "") ||
              !String(field?.value || "").trim()) {
            error(context, "Invalid Concept Illustration field");
          } else if (conceptFieldIds.has(field.id)) {
            error(context, `Duplicate Concept Illustration field: ${field.id}`);
          }
          conceptFieldIds.add(field?.id);
        }
      }
      if (record.steps?.length || record.rules?.length || record.regressions?.length) {
        error(context, "Concept Illustration must not declare replay or engine evidence");
      }
    }

    if (!Array.isArray(record?.steps)) {
      error(context, "steps must be an array");
    } else {
      const stepIds = new Set();
      if (record.componentModes?.includes("replay") && record.steps.length < 2) {
        error(context, "Replay mode requires at least two steps");
      }
      for (const step of record.steps) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(step?.id || "")) {
          error(context, "Invalid step ID");
        } else if (stepIds.has(step.id)) {
          error(context, "Duplicate step ID");
        }
        stepIds.add(step?.id);
        if (!String(step?.label || "").trim()) error(context, "Step label is required");
        if (typeof step?.text !== "string") error(context, "Replay step requires complete text");
        if (step?.versionId) {
          const version = comparison?.versions?.find(
            (item) => item.id === step.versionId
          );
          if (!version ||
              version.output !== step.text ||
              version.engineCommit !== step.engineCommit) {
            error(context, `Replay step provenance mismatch: ${step.id}`);
          }
        } else if (step?.id !== comparison?.sourceStepId ||
                   step?.text !== record?.fixture?.input) {
          error(context, `Replay source step mismatch: ${step?.id}`);
        }
        for (const ruleId of step?.rules || []) {
          if (!rules.has(ruleId)) error(context, `Missing step rule reference: ${ruleId}`);
        }
      }
    }

    if (!Array.isArray(record?.rules)) {
      error(context, "rules must be an array");
    } else {
      for (const ruleId of record.rules) {
        if (!rules.has(ruleId)) error(context, `Missing rule reference: ${ruleId}`);
      }
    }
    if (!Array.isArray(record?.regressions)) {
      error(context, "regressions must be an array");
    } else {
      for (const label of record.regressions) {
        const exact = `runTest("${label}"`;
        if (!regressionSource.includes(exact)) {
          error(context, `Missing regression reference: ${label}`);
        }
      }
    }

    if (!Array.isArray(record?.verification?.methods)) {
      error(context, "Verification methods must be an array");
    } else if (verifiedReplay) {
      for (const method of requiredMethods) {
        if (!record.verification.methods.includes(method)) {
          error(context, `Missing verification method: ${method}`);
        }
      }
    } else if (verifiedRecord && record.classification === "concept-illustration") {
      for (const method of requiredConceptMethods) {
        if (!record.verification.methods.includes(method)) {
          error(context, `Missing Concept Illustration verification method: ${method}`);
        }
      }
    }
    if (!Array.isArray(record?.verification?.dependencies)) {
      error(context, "Verification dependencies must be an array");
    } else {
      for (const dependency of record.verification.dependencies) {
        if (!["file", "regression", "schema"].includes(dependency?.type) ||
            !String(dependency?.value || "").trim()) {
          error(context, "Invalid verification dependency");
        } else if (dependency.type === "file" &&
                   !fs.existsSync(path.join(root, dependency.value))) {
          error(context, `Missing dependency path: ${dependency.value}`);
        }
      }
    }

    if (!Array.isArray(record?.limitations) ||
        record.limitations.length === 0 ||
        record.limitations.some((item) => !String(item).trim())) {
      error(context, "At least one specific limitation is required");
    } else if (
      record.limitations.length === 1 &&
      /^(results may vary|use caution|not perfect)\.?$/i.test(record.limitations[0])
    ) {
      error(context, "Limitation is too vague");
    }
    if (record?.id === "DEMO-001" && record?.limitations?.length < 5) {
      error(context, "DEMO-001 requires multiple explicit claim boundaries");
    }

    for (const field of ["staticFallback", "reducedMotion", "textAlternative"]) {
      if (typeof record?.accessibility?.[field] !== "boolean") {
        error(context, `Missing accessibility declaration: ${field}`);
      } else if (verifiedRecord && record.accessibility[field] !== true) {
        error(context, `Verified demonstration requires accessibility.${field}`);
      }
    }

    if (!Array.isArray(record?.analytics)) {
      error(context, "analytics must be an array");
    } else {
      const fixtureText = `${record.fixture?.input || ""}\n${record.fixture?.output || ""}`;
      for (const event of record.analytics) {
        analyticsCount += 1;
        const match = String(event).match(/^Editorial Demo \| (DEMO-\d{3}) \| ([a-z-]+)$/);
        if (!match || match[1] !== record.id || !allowedActions.has(match[2])) {
          error(context, `Invalid analytics event: ${JSON.stringify(event)}`);
        }
        const unsafe =
          String(event).length > 100 ||
          /[\r\n]|https?:\/\/|\?|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?\d[\s().-]*){7,}|\bSSML\b/i.test(String(event)) ||
          fixtureText.split(/\s+/).filter((word) => word.length > 12)
            .some((word) => String(event).includes(word));
        if (unsafe) error(context, "Privacy-unsafe analytics event");
      }
    }

    if (!Array.isArray(record?.destinations)) {
      error(context, "destinations must be an array");
    } else {
      destinationCount += record.destinations.length;
      for (const destination of record.destinations) {
        if (!["journal", "documentation", "handbook", "constitution"].includes(destination?.surface) ||
            !String(destination?.file || "").trim() ||
            !String(destination?.rootSelector || "").trim()) {
          error(context, "Invalid destination");
          continue;
        }
        const destinationPath = path.join(root, destination.file);
        if (!fs.existsSync(destinationPath)) {
          error(context, `Missing destination file: ${destination.file}`);
          continue;
        }
        const destinationHtml = fs.readFileSync(destinationPath, "utf8");
        const fallbackRoot = extractFallbackRoot(
          destinationHtml,
          destination.rootSelector
        );
        if (!fallbackRoot) {
          error(context, `Destination root not found: ${destination.rootSelector}`);
          continue;
        }
        compareFallback(
          record,
          fallbackRoot,
          `${context}:${destination.file}`,
          error
        );
      }
    }
  }

  if (options.qaFixtureHtml && registry.demonstrations[0]) {
    compareFallback(
      registry.demonstrations[0],
      options.qaFixtureHtml,
      "qa-fixture",
      error
    );
  }

  return {
    errors,
    warnings,
    summary: {
      schemaVersion: registry.schemaVersion,
      demonstrations: registry.demonstrations.length,
      classifications: classificationCounts,
      statuses: statusCounts,
      modes: modeCounts,
      analyticsEvents: analyticsCount,
      destinations: destinationCount
    }
  };
}

function getArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function runCli() {
  const registryPath = path.resolve(root, getArgument("--registry", defaultRegistry));
  const errors = [];
  const error = (context, message) => errors.push(`${context}: ${message}`);
  const registry = readJson(registryPath, path.relative(root, registryPath), error);
  const ruleData = readJson(rulesPath, "data/second-draft-rules.json", error);
  const regressionSource = fs.readFileSync(regressionsPath, "utf8");
  const qaFixtureHtml =
    registryPath === defaultRegistry && fs.existsSync(qaFixturePath)
      ? fs.readFileSync(qaFixturePath, "utf8")
      : null;
  const result = registry
    ? validateRegistryData(registry, { ruleData, regressionSource, qaFixtureHtml })
    : { errors: [], warnings: [], summary: {} };
  result.errors.unshift(...errors);

  console.log("Demonstration validation");
  console.log(`  Schema version: ${result.summary.schemaVersion ?? "unknown"}`);
  console.log(`  Demonstrations: ${result.summary.demonstrations ?? 0}`);
  console.log(`  Classifications: ${JSON.stringify(result.summary.classifications || {})}`);
  console.log(`  Statuses: ${JSON.stringify(result.summary.statuses || {})}`);
  console.log(`  Modes: ${JSON.stringify(result.summary.modes || {})}`);
  console.log(`  Analytics events: ${result.summary.analyticsEvents ?? 0}`);
  console.log(`  Publication destinations: ${result.summary.destinations ?? 0}`);
  console.log(`  Warnings: ${result.warnings.length}`);
  console.log(`  Errors: ${result.errors.length}`);
  for (const message of result.warnings) console.log(`WARNING ${message}`);
  for (const message of result.errors) console.error(`ERROR ${message}`);
  if (result.errors.length) process.exitCode = 1;
  else console.log("Demonstration validation passed");
}

const isDirect = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) runCli();

export {
  compareFallback,
  extractFallbackRoot,
  normalizeLines,
  validateRegistryData
};
