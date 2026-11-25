"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const dispatcherApi = require("../js/analytics-event-dispatcher.js");
const operationAdapter = require("../js/analytics-operation-instrumentation.js");
const bootstrap = require("../js/analytics-browser-bootstrap.js");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://pilot.example.test";
const KEY = dispatcherApi.ANALYTICS_PREFERENCE_KEY;

function browser() {
  let preference = null;
  return {
    document: {},
    location: { href: ORIGIN + "/pastelint/" },
    localStorage: {
      getItem(key) { assert.equal(key, KEY); return preference; },
      setItem(key, value) { assert.equal(key, KEY); preference = value; },
      removeItem(key) { assert.equal(key, KEY); preference = null; }
    },
    history: { state: null, replaceState() {} }
  };
}

function dependencies(state = "included") {
  return {
    preferenceDecision: Object.freeze({ state }),
    dispatcherApi,
    operationAdapter
  };
}

test("inactive bootstrap installs one immutable adapter and emits nothing", () => {
  const instance = browser();
  const events = [];
  const first = bootstrap.initialize(
    instance,
    dependencies(),
    { enabled: false },
    (payload) => events.push(payload),
    { emitPageView: true }
  );
  const second = bootstrap.initialize(
    instance,
    dependencies(),
    { enabled: true, allowedOrigin: ORIGIN },
    () => { throw new Error("replacement lifecycle used"); },
    { emitPageView: true }
  );

  assert.equal(first, second);
  assert.equal(first.initialized, true);
  assert.equal(first.operations.beginOperation().complete(), false);
  assert.equal(first.operations.recordCopy(), false);
  assert.deepEqual(events, []);
  const descriptor = Object.getOwnPropertyDescriptor(instance, "PasteLintAnalyticsOperations");
  assert.equal(descriptor.value, first.operations);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.configurable, false);
});

test("test-only enabled bootstrap owns one page view and valid operation lifecycle", () => {
  const instance = browser();
  const events = [];
  const lifecycle = bootstrap.initialize(
    instance,
    dependencies(),
    { enabled: true, allowedOrigin: ORIGIN },
    (payload) => events.push(payload),
    { emitPageView: true }
  );
  const operation = lifecycle.operations.beginOperation();
  assert.equal(operation.complete(), true);
  assert.equal(operation.complete(), false);
  assert.equal(lifecycle.operations.recordCopy(), true);
  assert.deepEqual(events.map((payload) => payload.event_type), [
    "page_view", "tool_start", "tool_complete", "output_copy"
  ]);
});

test("persisted exclusion introduced after bootstrap blocks later events", () => {
  const instance = browser();
  const events = [];
  const lifecycle = bootstrap.initialize(
    instance,
    dependencies(),
    { enabled: true, allowedOrigin: ORIGIN },
    (payload) => events.push(payload),
    { emitPageView: false }
  );
  const operation = lifecycle.operations.beginOperation();
  instance.localStorage.setItem(KEY, "excluded");
  assert.equal(operation.complete(), false);
  assert.equal(lifecycle.operations.recordCopy(), false);
  assert.deepEqual(events.map((payload) => payload.event_type), ["tool_start"]);
});

test("missing dependencies and adapter collisions fail inertly", () => {
  const missing = browser();
  const missingLifecycle = bootstrap.initialize(missing, {}, { enabled: false }, null, {});
  assert.equal(missingLifecycle.initialized, false);
  assert.equal(Object.prototype.hasOwnProperty.call(missing, "PasteLintAnalyticsOperations"), false);

  const collision = browser();
  const existing = Object.freeze({ beginOperation() {}, recordCopy() {} });
  Object.defineProperty(collision, "PasteLintAnalyticsOperations", {
    value: existing,
    writable: false,
    configurable: false
  });
  const collisionLifecycle = bootstrap.initialize(
    collision,
    dependencies(),
    { enabled: false },
    null,
    {}
  );
  assert.equal(collisionLifecycle.initialized, false);
  assert.equal(collision.PasteLintAnalyticsOperations, existing);
});

test("browser entry initializes permanently inactive without transport", () => {
  const context = vm.createContext({
    URL,
    WeakMap,
    Set,
    Object,
    document: {},
    location: { href: ORIGIN + "/pastelint/" },
    localStorage: { getItem() { return null; } },
    history: { state: null, replaceState() {} },
    PasteLintAnalyticsPreferenceDecision: Object.freeze({ state: "included" })
  });
  for (const file of [
    "js/analytics-event-dispatcher.js",
    "js/analytics-operation-instrumentation.js",
    "js/analytics-browser-bootstrap.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }

  assert.equal(context.PasteLintAnalyticsLifecycle.initialized, true);
  assert.equal(context.PasteLintAnalyticsOperations.beginOperation().complete(), false);
  assert.equal(context.PasteLintAnalyticsOperations.recordCopy(), false);
  assert.equal(Object.getOwnPropertyDescriptor(context, "PasteLintAnalyticsLifecycle").writable, false);

  const source = fs.readFileSync(path.join(ROOT, "js", "analytics-browser-bootstrap.js"), "utf8");
  for (const forbidden of ["fetch(", "sendBeacon", "XMLHttpRequest", "WebSocket", "workers.dev"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
