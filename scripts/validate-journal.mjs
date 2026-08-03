import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "journal-manifest.json");
const ledgerPath = path.join(root, "data", "knowledge-ledger.json");
const indexPath = path.join(root, "text-preparation-journal.html");
const sitemapPath = path.join(root, "sitemap.xml");
const feedPath = path.join(root, "journal.xml");
const shareHelperPath = path.join(root, "journal-share.js");

const errors = new Map();
const warnings = new Map();
let analyticsValidated = 0;

const approvedTracks = new Set(["engine-room", "editors-desk", "sources-case-studies"]);
const articleStatuses = new Set(["draft", "published", "retired"]);
const knowledgeStatuses = new Set([
  "Captured",
  "Briefed",
  "Drafted",
  "Published",
  "Updated",
  "Promoted",
  "Superseded",
  "Retired"
]);
const destinations = new Set([
  "engine-room",
  "editors-desk",
  "sources-case-studies",
  "editorial-canon",
  "second-draft-handbook",
  "internal-documentation"
]);
const eventPattern = /^Journal (?:Open \| [a-z0-9]+(?:-[a-z0-9]+)*|(?:CTA|Related|Media) \| [a-z0-9]+(?:-[a-z0-9]+)* \| [a-z0-9]+(?:-[a-z0-9]+)*|Share \| [a-z0-9]+(?:-[a-z0-9]+)* \| (?:native|copy-link))$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const knowledgeIdPattern = /^KN-\d{4}$/;
const ruleIdPattern = /^SD-[A-Z]+-\d{3}$/;
const authorsByTrack = {
  "engine-room": { type: "Person", name: "Guy Teichman", visible: "By Guy Teichman" },
  "sources-case-studies": { type: "Person", name: "Guy Teichman", visible: "By Guy Teichman" },
  "editors-desk": { type: "Organization", name: "PasteLint Editorial", visible: "By PasteLint Editorial" }
};
const feedCategoriesByTrack = {
  "engine-room": "Engine Room",
  "editors-desk": "Editor’s Desk",
  "sources-case-studies": "Sources & Case Studies"
};
const feedUrl = "https://guyt1225.github.io/pastelint/journal.xml";

function add(map, key, message) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(message);
}

function error(key, message) {
  add(errors, key, message);
}

function warning(key, message) {
  add(warnings, key, message);
}

function readText(file, key = file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (cause) {
    error(key, `Cannot read ${path.relative(root, file)}: ${cause.message}`);
    return "";
  }
}

function readJson(file, key) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (cause) {
    error(key, `Invalid JSON: ${cause.message}`);
    return null;
  }
}

function decode(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&rsquo;|&#8217;|&#x2019;/gi, "’")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi, "\"")
    .replace(/&amp;/gi, "&")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rarr;/gi, "→")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countLiteral(text, value) {
  return text.split(value).length - 1;
}

function cleanCanonical(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.search && !url.hash && url.toString() === value;
  } catch {
    return false;
  }
}

function validIsoDate(value) {
  if (!datePattern.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function readableDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function collectTypedNodes(value, type, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectTypedNodes(item, type, found);
  } else if (value && typeof value === "object") {
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.includes(type)) found.push(value);
    for (const nested of Object.values(value)) collectTypedNodes(nested, type, found);
  }
  return found;
}

function validateEvent(event, key) {
  if (typeof event !== "string" || !eventPattern.test(event)) {
    error(key, `Invalid analytics event: ${JSON.stringify(event)}`);
    return;
  }
  const unsafe =
    /https?:\/\//i.test(event) ||
    event.includes("?") ||
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(event) ||
    /(?:\+?\d[\s().-]*){7,}/.test(event);
  if (unsafe) error(key, `Privacy-unsafe analytics event: ${event}`);
  analyticsValidated += 1;
}

const manifest = readJson(manifestPath, "data/journal-manifest.json");
const ledger = readJson(ledgerPath, "data/knowledge-ledger.json");
const indexHtml = readText(indexPath, "text-preparation-journal.html");
const sitemapXml = readText(sitemapPath, "sitemap.xml");
const feedXml = readText(feedPath, "journal.xml");
const shareHelper = readText(shareHelperPath, "journal-share.js");

if (!shareHelper.includes('link[rel="canonical"]')) error("journal-share.js", "Share helper must derive the URL from canonical metadata");
if (/https?:\/\/[^\s"'`]+/i.test(shareHelper)) error("journal-share.js", "Share helper must not contain a third-party endpoint or hardcoded article URL");

const articles = Array.isArray(manifest?.articles) ? manifest.articles : [];
const knowledge = Array.isArray(ledger?.knowledge) ? ledger.knowledge : [];

if (manifest && manifest.schemaVersion !== 1) {
  error("data/journal-manifest.json", `Unsupported schemaVersion: ${manifest.schemaVersion}`);
}
if (manifest && !Array.isArray(manifest.articles)) {
  error("data/journal-manifest.json", "articles must be an array");
}
if (ledger && ledger.schemaVersion !== 1) {
  error("data/knowledge-ledger.json", `Unsupported schemaVersion: ${ledger.schemaVersion}`);
}
if (ledger && !Array.isArray(ledger.knowledge)) {
  error("data/knowledge-ledger.json", "knowledge must be an array");
}

const articleBySlug = new Map();
const files = new Set();
for (const article of articles) {
  const key = `article:${article?.slug ?? "unknown"}`;
  const required = [
    "slug",
    "file",
    "canonical",
    "title",
    "track",
    "published",
    "modified",
    "summary",
    "status",
    "primaryCta",
    "related",
    "sources",
    "analytics",
    "engineCommits",
    "ruleIds",
    "knowledgeIds"
  ];
  for (const field of required) {
    if (!(field in (article ?? {}))) error(key, `Missing required field: ${field}`);
  }
  if (!slugPattern.test(article?.slug ?? "")) error(key, "slug must be lowercase kebab-case");
  if (articleBySlug.has(article?.slug)) error(key, `Duplicate slug: ${article.slug}`);
  articleBySlug.set(article?.slug, article);
  if (files.has(article?.file)) error(key, `Duplicate filename: ${article.file}`);
  files.add(article?.file);
  if (!approvedTracks.has(article?.track)) error(key, `Invalid track: ${article?.track}`);
  if (!articleStatuses.has(article?.status)) error(key, `Invalid status: ${article?.status}`);
  if (
    article?.status === "retired" &&
    !article?.replacement &&
    !article?.redirect &&
    !article?.archivalDisposition
  ) {
    error(key, "Retired articles require replacement, redirect, or archivalDisposition");
  }
  if (!article?.title || !article?.summary || !article?.file) error(key, "title, summary, and file are required");
  for (const field of ["published", "modified"]) {
    if (article?.[field] !== null && !validIsoDate(article?.[field])) {
      error(key, `${field} must be an ISO date or null`);
    }
  }
  if (article?.status === "published" && (!validIsoDate(article?.published) || !validIsoDate(article?.modified))) {
    error(key, "Published articles require valid published and modified ISO dates");
  }
  if (article?.status === "published" && !cleanCanonical(article?.canonical)) {
    error(key, "Published canonical must be a clean HTTPS URL without query or fragment");
  }
  if (!Array.isArray(article?.related) || !Array.isArray(article?.sources)) {
    error(key, "related and sources must be arrays");
  }
  if (!Array.isArray(article?.engineCommits) || !Array.isArray(article?.ruleIds) || !Array.isArray(article?.knowledgeIds)) {
    error(key, "engineCommits, ruleIds, and knowledgeIds must be arrays");
  }
  for (const related of article?.related ?? []) {
    if (related === article.slug) error(key, "Related articles cannot self-reference");
  }
  for (const ruleId of article?.ruleIds ?? []) {
    if (!ruleIdPattern.test(ruleId)) error(key, `Invalid rule ID: ${ruleId}`);
  }
  for (const source of article?.sources ?? []) {
    if (!source?.id || !source?.type || !source?.url || !source?.analyticsDestination) {
      error(key, "Every source requires id, type, url, and analyticsDestination");
    }
    if (!slugPattern.test(source?.id ?? "") || !slugPattern.test(source?.analyticsDestination ?? "")) {
      error(key, `Source IDs must be lowercase kebab-case: ${source?.id ?? "unknown"}`);
    }
    try {
      new URL(source.url);
    } catch {
      error(key, `Invalid source URL: ${source?.url}`);
    }
    const expectedMediaEvent = `Journal Media | ${article.slug} | ${source.analyticsDestination}`;
    if (article?.status === "published" && !article?.analytics?.media?.includes(expectedMediaEvent)) {
      error(key, `Source is missing its declared media event: ${expectedMediaEvent}`);
    }
  }
  const analytics = article?.analytics;
  if (!analytics || !Array.isArray(analytics.cta) || !Array.isArray(analytics.related) || !Array.isArray(analytics.media) || !Array.isArray(analytics.share)) {
    error(key, "analytics requires open, cta, related, media, and share");
  } else {
    if (analytics.open !== null) validateEvent(analytics.open, key);
    for (const event of [...analytics.cta, ...analytics.related, ...analytics.media, ...analytics.share]) validateEvent(event, key);
    if (article?.status === "published" && analytics.open !== `Journal Open | ${article.slug}`) {
      error(key, "analytics.open must use the article slug");
    }
    if (article?.status === "draft") {
      if (analytics.open !== null) {
        error(key, "Draft analytics.open must remain null until publication");
      }
      if (analytics.cta.length > 0 || analytics.related.length > 0 || analytics.media.length > 0 || analytics.share.length > 0) {
        error(key, "Draft analytics arrays must remain empty until publication");
      }
      if (article.primaryCta !== null) {
        error(key, "Draft primaryCta must remain null until publication");
      }
    }
    for (const event of analytics.cta) {
      if (!event.startsWith(`Journal CTA | ${article.slug} | `)) {
        error(key, `CTA event uses the wrong source slug: ${event}`);
      }
    }
    for (const event of analytics.related) {
      if (!event.startsWith(`Journal Related | ${article.slug} | `)) {
        error(key, `Related event uses the wrong source slug: ${event}`);
      }
    }
    for (const event of analytics.media) {
      if (!event.startsWith(`Journal Media | ${article.slug} | `)) {
        error(key, `Media event uses the wrong source slug: ${event}`);
      }
    }
    if (article?.status === "published") {
      const expectedShare = [
        `Journal Share | ${article.slug} | native`,
        `Journal Share | ${article.slug} | copy-link`
      ];
      if (analytics.share.length !== 2 || new Set(analytics.share).size !== 2 || expectedShare.some((event) => !analytics.share.includes(event))) {
        error(key, "Published analytics.share must contain exactly the native and copy-link events");
      }
    }
  }
  if (article?.primaryCta) {
    if (!article.primaryCta.destination || !article.primaryCta.href || !article.primaryCta.event) {
      error(key, "primaryCta requires destination, href, and event");
    }
    if (!analytics?.cta?.includes(article.primaryCta.event)) {
      error(key, "primaryCta event must be declared in analytics.cta");
    }
  }
  if (article?.status === "published" && article?.track === "engine-room" && !(article?.engineCommits?.length)) {
    warning(key, "No engine commits declared");
  }
  if (article?.status === "published" && article?.track === "engine-room" && !(article?.ruleIds?.length)) {
    warning(key, "No rule IDs declared");
  }
  if (article?.status === "published" && !(article?.knowledgeIds?.length)) warning(key, "No knowledge IDs declared");
}

for (const article of articles) {
  const key = `article:${article.slug}`;
  for (const related of article.related ?? []) {
    if (!articleBySlug.has(related)) error(key, `Unknown related article slug: ${related}`);
  }
}

const knowledgeIds = new Set();
for (const item of knowledge) {
  const key = `knowledge:${item?.knowledgeId ?? "unknown"}`;
  const required = [
    "knowledgeId",
    "title",
    "cycle",
    "commit",
    "date",
    "trigger",
    "reusableInsight",
    "evidence",
    "inference",
    "claimBoundary",
    "primaryDestination",
    "status",
    "relatedRuleIds",
    "relatedTests",
    "relatedArticles",
    "secondaryReferences",
    "canonPromotionCandidate",
    "handbookPromotionCandidate",
    "invalidationRisk",
    "existingKnowledgePotentiallyAffected",
    "lastReviewed"
  ];
  for (const field of required) {
    if (!(field in (item ?? {}))) error(key, `Missing required field: ${field}`);
  }
  if (!knowledgeIdPattern.test(item?.knowledgeId ?? "")) error(key, "Invalid knowledge ID");
  if (knowledgeIds.has(item?.knowledgeId)) error(key, `Duplicate knowledge ID: ${item.knowledgeId}`);
  knowledgeIds.add(item?.knowledgeId);
  if (!knowledgeStatuses.has(item?.status)) error(key, `Invalid knowledge status: ${item?.status}`);
  if (!destinations.has(item?.primaryDestination)) error(key, `Invalid primary destination: ${item?.primaryDestination}`);
  if (!datePattern.test(item?.date ?? "") || !datePattern.test(item?.lastReviewed ?? "")) {
    error(key, "date and lastReviewed must use YYYY-MM-DD");
  }
  for (const ruleId of item?.relatedRuleIds ?? []) {
    if (!ruleIdPattern.test(ruleId)) error(key, `Invalid related rule ID: ${ruleId}`);
  }
  for (const slug of item?.relatedArticles ?? []) {
    if (!articleBySlug.has(slug)) error(key, `Unknown related article: ${slug}`);
  }
  if (typeof item?.canonPromotionCandidate !== "boolean" || typeof item?.handbookPromotionCandidate !== "boolean") {
    error(key, "Promotion candidates must be booleans");
  }
}

for (const article of articles) {
  const key = `article:${article.slug}`;
  for (const knowledgeId of article.knowledgeIds ?? []) {
    if (!knowledgeIds.has(knowledgeId)) error(key, `Unknown knowledge ID: ${knowledgeId}`);
  }
}

for (const article of articles.filter((item) => item.status === "published")) {
  const key = `article:${article.slug}`;
  const articlePath = path.join(root, article.file);
  if (!fs.existsSync(articlePath)) {
    error(key, `Missing published article file: ${article.file}`);
    continue;
  }
  const html = readText(articlePath, key);
  const feedDiscoveryCount = (
    html.match(/<link\s+rel="alternate"\s+type="application\/rss\+xml"\s+title="Text Preparation Journal"\s+href="journal\.xml"\s*\/?>/gi) ?? []
  ).length;
  if (feedDiscoveryCount !== 1) {
    error(key, `RSS discovery link must appear exactly once (${feedDiscoveryCount})`);
  }
  const author = authorsByTrack[article.track];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (canonical !== article.canonical) error(key, `Canonical mismatch: ${canonical ?? "missing"}`);
  const h1 = decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  if (h1 !== article.title) error(key, `H1/title mismatch: ${JSON.stringify(h1)}`);
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s*\|\s*PasteLint$/, "");
  if (!title) error(key, "Title metadata is missing or unparseable");
  if (title !== article.title) warning(key, `Title metadata includes legacy framing: ${JSON.stringify(title)}`);
  const publicationMetaCount = (html.match(/class="[^"]*\bjournal-publication-meta\b[^"]*"/gi) ?? []).length;
  if (publicationMetaCount !== 1) error(key, `Publication metadata region must appear exactly once (${publicationMetaCount})`);
  const authorCount = countLiteral(html, `<span class="journal-author">${author.visible}</span>`);
  if (authorCount !== 1) error(key, `Approved visible byline must appear exactly once (${authorCount})`);
  for (const candidate of Object.values(authorsByTrack)) {
    if (candidate.visible !== author.visible && html.includes(`<span class="journal-author">${candidate.visible}</span>`)) {
      error(key, `Conflicting visible byline: ${candidate.visible}`);
    }
  }
  const publicationTimes = [...html.matchAll(/<time\s+datetime="([^"]+)">Published ([^<]+)<\/time>/gi)];
  if (publicationTimes.length !== 1) {
    error(key, `Visible publication time must appear exactly once (${publicationTimes.length})`);
  } else {
    if (publicationTimes[0][1] !== article.published) error(key, "Visible publication datetime does not match manifest");
    if (publicationTimes[0][2] !== readableDate(article.published)) error(key, "Visible publication date text does not match manifest");
  }
  const metaAuthor = html.match(/<meta\s+name="author"\s+content="([^"]+)"\s*\/?>/i)?.[1];
  if (metaAuthor !== author.name) error(key, `Meta author mismatch: ${metaAuthor ?? "missing"}`);
  const publishedMeta = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i)?.[1];
  const modifiedMeta = html.match(/<meta\s+property="article:modified_time"\s+content="([^"]+)"/i)?.[1];
  if (publishedMeta !== article.published) error(key, "article:published_time does not match manifest");
  if (modifiedMeta !== article.modified) error(key, "article:modified_time does not match manifest");
  const trackSignals = {
    "engine-room": /journal-track--engine-room|Engine Room/i,
    "editors-desk": /journal-track--editors-desk|Editor(?:&rsquo;|'|’)s Desk/i,
    "sources-case-studies": /Primary source|Source signal|Field Note|fieldnote-source/i
  };
  if (!trackSignals[article.track].test(html)) error(key, `Track marker not found for ${article.track}`);
  const requiredEvents = [
    ...(article.analytics?.cta ?? []),
    ...(article.analytics?.related ?? []),
    ...(article.analytics?.media ?? [])
  ];
  for (const event of requiredEvents) {
    const attribute = `data-statkit-event="${event}"`;
    const count = countLiteral(html, attribute);
    if (count !== 1) error(key, `Required event must appear exactly once (${count}): ${event}`);
    if (!new RegExp(`<a\\b[^>]*${escapeRegex(attribute)}`, "i").test(html)) {
      error(key, `Required event is not attached to an ordinary anchor: ${event}`);
    }
  }
  if (article.primaryCta) {
    if (!html.includes(`href="${article.primaryCta.href}"`)) error(key, `CTA href missing: ${article.primaryCta.href}`);
    const target = article.primaryCta.href.split("#")[0];
    if (target && !/^https?:/i.test(target) && !fs.existsSync(path.join(root, target))) {
      error(key, `Broken CTA destination: ${article.primaryCta.href}`);
    }
  }
  for (const related of article.related ?? []) {
    const target = articleBySlug.get(related);
    if (!target || !html.includes(`href="${target.file}"`)) error(key, `Related destination missing: ${related}`);
  }
  for (const source of article.sources ?? []) {
    if (!html.includes(`href="${source.url}"`)) error(key, `Declared source link missing: ${source.id}`);
  }
  const jsonLdBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const parsedJsonLd = [];
  for (const [index, block] of jsonLdBlocks.entries()) {
    try {
      parsedJsonLd.push(JSON.parse(block[1]));
    } catch (cause) {
      error(key, `Invalid JSON-LD block ${index + 1}: ${cause.message}`);
    }
  }
  const articleNodes = parsedJsonLd.flatMap((block) => collectTypedNodes(block, "Article"));
  if (articleNodes.length !== 1) {
    error(key, `Exactly one Article JSON-LD node is required (${articleNodes.length})`);
  } else {
    const node = articleNodes[0];
    if (decode(node.headline ?? "") !== decode(article.title)) error(key, "Article JSON-LD headline mismatch");
    if (node.datePublished !== article.published || node.dateModified !== article.modified) error(key, "Article JSON-LD dates do not match manifest");
    if (node.author?.["@type"] !== author.type || node.author?.name !== author.name) error(key, "Article JSON-LD author does not match track policy");
    if (node.publisher?.["@type"] !== "Organization" || node.publisher?.name !== "PasteLint") error(key, "Article JSON-LD publisher must be PasteLint");
    if (node.mainEntityOfPage !== article.canonical) error(key, "Article JSON-LD mainEntityOfPage mismatch");
  }
  const shareButtons = [...html.matchAll(/<button\b[^>]*data-journal-share(?:\s|=)[^>]*>[\s\S]*?<\/button>/gi)];
  if (shareButtons.length !== 1) {
    error(key, `Share button must appear exactly once (${shareButtons.length})`);
  } else {
    const button = shareButtons[0][0];
    if (!/\btype="button"/i.test(button)) error(key, "Share button must use type=button");
    if (!/>Share article</i.test(button)) error(key, "Share button must have a visible Share article label");
    const nativeEvent = `Journal Share | ${article.slug} | native`;
    const copyEvent = `Journal Share | ${article.slug} | copy-link`;
    if (countLiteral(button, `data-share-native-event="${nativeEvent}"`) !== 1) error(key, "Native Share event attribute is missing or duplicated");
    if (countLiteral(button, `data-share-copy-event="${copyEvent}"`) !== 1) error(key, "Copy-link Share event attribute is missing or duplicated");
  }
  const statusCount = (html.match(/data-journal-share-status\b/gi) ?? []).length;
  if (statusCount !== 1 || !/<p\b[^>]*data-journal-share-status[^>]*aria-live="polite"/i.test(html)) {
    error(key, "Exactly one polite live Share status is required");
  }
  const helperCount = countLiteral(html, 'src="journal-share.js"');
  if (helperCount !== 1) error(key, `Shared helper must be included exactly once (${helperCount})`);
  const metaDescription = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  if (metaDescription && decode(metaDescription) !== decode(article.summary)) {
    warning(key, "Manifest summary differs from meta description");
  }
  if (!/journal-track--(?:engine-room|editors-desk|sources-case-studies)/.test(html)) {
    warning(key, "Older article uses a legacy visual treatment");
  }

  const cardPattern = new RegExp(
    `<a\\b[^>]*href="${escapeRegex(article.file)}"[^>]*data-statkit-event="${escapeRegex(article.analytics.open)}"[^>]*>`,
    "gi"
  );
  const cardMatches = indexHtml.match(cardPattern) ?? [];
  if (cardMatches.length !== 1) {
    error(key, `Journal card with declared Open event must appear exactly once (${cardMatches.length})`);
  }
  const sitemapCount = countLiteral(sitemapXml, `<loc>${article.canonical}</loc>`);
  if (sitemapCount !== 1) error(key, `Sitemap canonical must appear exactly once (${sitemapCount})`);
  const sitemapEntry = sitemapXml.match(
    new RegExp(`<url>\\s*<loc>${escapeRegex(article.canonical)}</loc>\\s*<lastmod>([^<]+)</lastmod>`, "i")
  );
  if (sitemapEntry?.[1] !== article.modified) error(key, "Sitemap lastmod does not match manifest modified date");
}

const journalFeedDiscoveryCount = (
  indexHtml.match(/<link\s+rel="alternate"\s+type="application\/rss\+xml"\s+title="Text Preparation Journal"\s+href="journal\.xml"\s*\/?>/gi) ?? []
).length;
if (journalFeedDiscoveryCount !== 1) {
  error("text-preparation-journal.html", `RSS discovery link must appear exactly once (${journalFeedDiscoveryCount})`);
}
const journalFeedUtilityCount = (
  indexHtml.match(/<a\s+class="journal-rss-link"\s+href="journal\.xml"\s+type="application\/rss\+xml"\s+aria-label="Subscribe to the Text Preparation Journal RSS feed">/gi) ?? []
).length;
if (journalFeedUtilityCount !== 2) {
  error("text-preparation-journal.html", `RSS utility link must appear in the masthead and footer (${journalFeedUtilityCount}/2)`);
}
const journalFeedIconCount = (
  indexHtml.match(/<svg\s+viewBox="0 0 24 24"\s+aria-hidden="true"\s+focusable="false">/gi) ?? []
).length;
if (journalFeedIconCount !== 2) {
  error("text-preparation-journal.html", `RSS utility icons must be decorative and unfocusable (${journalFeedIconCount}/2)`);
}

if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/i.test(feedXml)) {
  error("journal.xml", "Feed must declare UTF-8 XML");
}
if (!/<rss\b[^>]*version="2\.0"[^>]*xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/i.test(feedXml)) {
  error("journal.xml", "Feed must be RSS 2.0 and declare the Atom namespace");
}
if (!feedXml.includes(`<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`)) {
  error("journal.xml", "Feed must contain its canonical Atom self link");
}

const feedChannelTitle = decode(feedXml.match(/<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
const feedChannelLink = decode(feedXml.match(/<channel>[\s\S]*?<link>([\s\S]*?)<\/link>/i)?.[1] ?? "");
const feedLanguage = decode(feedXml.match(/<language>([\s\S]*?)<\/language>/i)?.[1] ?? "");
if (feedChannelTitle !== "Text Preparation Journal") error("journal.xml", "Channel title is incorrect");
if (feedChannelLink !== "https://guyt1225.github.io/pastelint/text-preparation-journal.html") {
  error("journal.xml", "Channel link is incorrect");
}
if (feedLanguage !== "en-us") error("journal.xml", "Channel language must be en-us");

const publishedArticles = articles.filter((item) => item.status === "published");
const feedItems = [...feedXml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
if (feedItems.length !== publishedArticles.length) {
  error("journal.xml", `Feed item count must match published manifest articles (${feedItems.length}/${publishedArticles.length})`);
}

const feedItemsByLink = new Map();
let previousFeedDate = Number.POSITIVE_INFINITY;
for (const item of feedItems) {
  const value = (tag) => decode(item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
  const link = value("link");
  const title = value("title");
  const guid = value("guid");
  const pubDate = value("pubDate");
  const category = value("category");
  const description = value("description");
  const timestamp = Date.parse(pubDate);

  if (!link || feedItemsByLink.has(link)) error("journal.xml", `Feed item link is missing or duplicated: ${link || "missing"}`);
  feedItemsByLink.set(link, { title, guid, pubDate, category, description });
  if (!/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} 12:00:00 GMT$/.test(pubDate) || Number.isNaN(timestamp)) {
    error("journal.xml", `Invalid RFC 822 publication date: ${pubDate || "missing"}`);
  }
  if (timestamp > previousFeedDate) error("journal.xml", "Feed items must be ordered newest first");
  previousFeedDate = timestamp;
  if (!item.includes(`<guid isPermaLink="true">${link}</guid>`)) {
    error("journal.xml", `Item GUID must be the canonical permalink: ${link || "missing"}`);
  }
}

for (const article of publishedArticles) {
  const key = `article:${article.slug}`;
  const item = feedItemsByLink.get(article.canonical);
  if (!item) {
    error(key, "Published article is missing from RSS");
    continue;
  }
  if (item.title !== article.title) error(key, "RSS title does not match manifest");
  if (item.guid !== article.canonical) error(key, "RSS GUID does not match canonical");
  if (item.category !== feedCategoriesByTrack[article.track]) error(key, "RSS category does not match track");
  if (item.description !== article.summary) error(key, "RSS description does not match manifest summary");
  const itemDate = new Date(item.pubDate);
  if (Number.isNaN(itemDate.valueOf()) || itemDate.toISOString().slice(0, 10) !== article.published) {
    error(key, "RSS publication date does not match manifest");
  }
}

const lastBuildDate = decode(feedXml.match(/<lastBuildDate>([\s\S]*?)<\/lastBuildDate>/i)?.[1] ?? "");
const latestModified = publishedArticles.map((item) => item.modified).sort().at(-1);
const parsedLastBuildDate = new Date(lastBuildDate);
if (
  Number.isNaN(parsedLastBuildDate.valueOf()) ||
  parsedLastBuildDate.toISOString().slice(0, 10) !== latestModified
) {
  error("journal.xml", "lastBuildDate must match the latest published manifest modification date");
}

for (const event of [
  "Journal Track | engine-room",
  "Journal Track | editors-desk",
  "Journal Track | sources-case-studies"
]) {
  const count = countLiteral(indexHtml, `data-statkit-event="${event}"`);
  if (count !== 1) error("text-preparation-journal.html", `Global track event must appear exactly once (${count}): ${event}`);
  analyticsValidated += 1;
}

const sitemapArticleUrls = [...sitemapXml.matchAll(/<loc>(https:\/\/[^<]+\/journal-[^<]+\.html)<\/loc>/g)].map(
  (match) => match[1]
);
for (const url of sitemapArticleUrls) {
  if (url.includes("?") || url.includes("#")) error("sitemap.xml", `Parameterized article URL: ${url}`);
}
for (const [url, count] of Object.entries(Object.fromEntries(sitemapArticleUrls.map((url) => [url, 0])))) {
  const actual = sitemapArticleUrls.filter((candidate) => candidate === url).length;
  if (actual > 1) error("sitemap.xml", `Duplicate article URL (${actual}): ${url}`);
}

function printGroups(label, groups) {
  if (!groups.size) return;
  console.log(`\n${label}:`);
  for (const [key, messages] of groups) {
    console.log(`  ${key}`);
    for (const message of messages) console.log(`    - ${message}`);
  }
}

printGroups("Warnings", warnings);
printGroups("Errors", errors);

const published = articles.filter((item) => item.status === "published").length;
const draft = articles.filter((item) => item.status === "draft").length;
const retired = articles.filter((item) => item.status === "retired").length;
console.log("\nJournal validation summary:");
console.log(`  Total articles: ${articles.length}`);
console.log(`  Published: ${published}`);
console.log(`  Draft: ${draft}`);
console.log(`  Retired: ${retired}`);
console.log(`  Knowledge items: ${knowledge.length}`);
console.log(`  Analytics events validated: ${analyticsValidated}`);
console.log(`  Warnings: ${[...warnings.values()].reduce((total, items) => total + items.length, 0)}`);

if (errors.size) {
  console.error("Journal validation failed");
  process.exitCode = 1;
} else {
  console.log("Journal validation passed");
}
