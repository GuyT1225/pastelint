"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "journal-manifest.json"), "utf8")
);
const journalIndex = fs.readFileSync(
  path.join(ROOT, "text-preparation-journal.html"),
  "utf8"
);

const sectionIds = {
  "sources-case-studies": "sources-case-studies",
  "editors-desk": "editors-desk",
  "engine-room": "engine-room"
};

function getDepartmentSection(track) {
  const id = sectionIds[track];
  assert.ok(id, `Unknown Journal track: ${track}`);

  const startToken = `<section id="${id}"`;
  const start = journalIndex.indexOf(startToken);
  assert.ok(start >= 0, `Missing Journal department section: ${id}`);

  const end = journalIndex.indexOf("</section>", start);
  assert.ok(end > start, `Unclosed Journal department section: ${id}`);

  return journalIndex.slice(start, end);
}

function countOccurrences(source, needle) {
  return source.split(needle).length - 1;
}

const published = manifest.articles.filter((article) => article.status === "published");
const articleSlugs = new Set(published.map((article) => article.slug));

published.forEach((article) => {
  const section = getDepartmentSection(article.track);
  const href = `href="${article.file}"`;
  assert.strictEqual(
    countOccurrences(section, href),
    1,
    `${article.title} must appear exactly once in its permanent department ledger`
  );

  article.related.forEach((relatedSlug) => {
    assert.ok(
      articleSlugs.has(relatedSlug),
      `${article.slug} references unknown related article: ${relatedSlug}`
    );

    const event = `Journal Related | ${article.slug} | ${relatedSlug}`;
    assert.ok(
      article.analytics.related.includes(event),
      `${article.slug} is missing analytics metadata for ${relatedSlug}`
    );
  });
});

console.log(
  `✓ Journal continuity: ${published.length} published articles remain indexed by department`
);
console.log("✓ Journal relationship targets and analytics metadata are valid");
