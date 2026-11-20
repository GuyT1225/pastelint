import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const referenceRoot = process.argv[2];
if (!referenceRoot) {
  throw new Error("Usage: node scripts/analytics-contract-sync.mjs <analytics-repository>");
}

const require = createRequire(import.meta.url);
const client = require("../js/analytics-event-dispatcher.js");
const server = await import(pathToFileURL(path.join(
  path.resolve(referenceRoot),
  "src",
  "public-ingestion-validation.js"
)).href);

test("public dispatcher mirrors the canonical backend event contract", () => {
  assert.deepEqual(client.PAGE_PATHS, server.PUBLIC_PAGE_PATHS);
  const eventTypes = ["page_view", "tool_start", "tool_complete", "output_copy", "unknown"];
  const pagePaths = [
    ...server.PUBLIC_PAGE_PATHS,
    "/pastelint/index.html",
    "/pastelint/privacy.html",
    "/pastelint/ssml_builder.html"
  ];
  for (const eventType of eventTypes) {
    for (const pagePath of pagePaths) {
      assert.equal(
        client.isAllowedEvent(eventType, pagePath),
        server.isAllowedPublicEvent(eventType, pagePath),
        eventType + " " + pagePath
      );
    }
  }
});
