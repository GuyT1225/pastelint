"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const analytics = require("../js/analytics-event-dispatcher.js");

const ORIGIN = "https://pilot.example.test";
const ENABLED = Object.freeze({ enabled: true, allowedOrigin: ORIGIN });
const KEY = analytics.ANALYTICS_PREFERENCE_KEY;

function browser(suffix = "/pastelint/", initial = null) {
  let value = initial;
  const instance = {
    document: {},
    location: { href: ORIGIN + suffix },
    localStorage: {
      getItem(key) { assert.equal(key, KEY); return value; },
      setItem(key, next) { assert.equal(key, KEY); value = next; },
      removeItem(key) { assert.equal(key, KEY); value = null; }
    },
    history: {
      state: null,
      replaceState(_state, _unused, next) {
        instance.location.href = new URL(next, instance.location.href).href;
      }
    }
  };
  return instance;
}

function setup(suffix, config = ENABLED, initial = null, sink) {
  const events = [];
  const instance = browser(suffix, initial);
  const dispatcher = analytics.initialize(
    instance,
    config,
    sink || ((payload) => events.push(payload))
  );
  return { instance, dispatcher, events };
}

test("dispatcher is disabled by default and emits nothing automatically", () => {
  const { dispatcher, events } = setup("/pastelint/", {});
  assert.deepEqual(events, []);
  assert.equal(dispatcher.dispatch("page_view"), false);
  assert.deepEqual(events, []);
});

test("canonical contract contains only approved event types and paths", () => {
  assert.deepEqual(analytics.EVENT_TYPES, [
    "page_view", "tool_start", "tool_complete", "output_copy"
  ]);
  assert.equal(analytics.PAGE_PATHS.length, 27);
  assert.equal(new Set(analytics.PAGE_PATHS).size, 27);
});

test("exact approved event and page pairs are accepted", () => {
  const toolPaths = [
    "/pastelint/", "/pastelint/second-draft.html", "/pastelint/SSML_builder.html"
  ];
  for (const pagePath of analytics.PAGE_PATHS) {
    assert.equal(analytics.isAllowedEvent("page_view", pagePath), true);
    for (const eventType of ["tool_start", "tool_complete", "output_copy"]) {
      assert.equal(analytics.isAllowedEvent(eventType, pagePath), toolPaths.includes(pagePath));
    }
  }
});

test("unknown events and paths are rejected", () => {
  assert.equal(analytics.isAllowedEvent("unknown", "/pastelint/"), false);
  assert.equal(analytics.isAllowedEvent("page_view", "/pastelint/privacy.html"), false);
  assert.equal(analytics.isAllowedEvent("page_view", "/pastelint/ssml_builder.html"), false);
});

test("only the explicit homepage index alias is normalized", () => {
  assert.equal(analytics.normalizePagePath("/pastelint/index.html"), "/pastelint/");
  assert.equal(analytics.normalizePagePath("/pastelint/%69ndex.html"), "/pastelint/%69ndex.html");
  const { dispatcher, events } = setup("/pastelint/index.html");
  assert.equal(dispatcher.dispatch("tool_start"), true);
  assert.deepEqual(events[0], { event_type: "tool_start", page_path: "/pastelint/" });
});

test("exact configured HTTPS origin is required", () => {
  for (const config of [
    { enabled: "true", allowedOrigin: ORIGIN },
    { enabled: true },
    { enabled: true, allowedOrigin: "*" },
    { enabled: true, allowedOrigin: ORIGIN + "/" },
    { enabled: true, allowedOrigin: "http://pilot.example.test" },
    { enabled: true, allowedOrigin: "https://elsewhere.test" }
  ]) {
    assert.equal(setup("/pastelint/", config).dispatcher.dispatch("page_view"), false);
  }
});

test("stored exclusion and unknown preference values deny dispatch", () => {
  for (const value of ["excluded", "", "unknown", "included"]) {
    assert.equal(setup("/pastelint/", ENABLED, value).dispatcher.dispatch("page_view"), false);
  }
});

test("exclude wins ambiguous controls and persists while disabled", () => {
  for (const query of [
    "include&analytics=exclude",
    "exclude&analytics=include",
    "exclude&analytics=exclude"
  ]) {
    const { instance, dispatcher } = setup(
      "/pastelint/?analytics=" + query,
      {}
    );
    assert.equal(dispatcher.dispatch("page_view"), false);
    assert.equal(instance.localStorage.getItem(KEY), "excluded");
    assert.equal(new URL(instance.location.href).searchParams.has("analytics"), false);
  }
});

test("verified include removes preference and cleans the URL", () => {
  const { instance, dispatcher } = setup(
    "/pastelint/?analytics=include",
    ENABLED,
    "excluded"
  );
  assert.equal(dispatcher.dispatch("page_view"), true);
  assert.equal(instance.localStorage.getItem(KEY), null);
  assert.equal(instance.location.href, ORIGIN + "/pastelint/");
});

test("duplicate or unknown controls deny the document", () => {
  for (const query of ["include&analytics=include", "unknown", ""]) {
    const { dispatcher } = setup(
      "/pastelint/?analytics=" + query,
      ENABLED,
      "excluded"
    );
    assert.equal(dispatcher.dispatch("page_view"), false);
  }
});

test("storage access and mutation failures fail closed", () => {
  const fail = () => { throw new Error("restricted"); };
  const cases = [];
  const access = browser(); Object.defineProperty(access, "localStorage", { get: fail }); cases.push(access);
  const read = browser(); read.localStorage.getItem = fail; cases.push(read);
  const write = browser("/pastelint/?analytics=exclude"); write.localStorage.setItem = fail; cases.push(write);
  const remove = browser("/pastelint/?analytics=include", "excluded"); remove.localStorage.removeItem = fail; cases.push(remove);
  for (const instance of cases) {
    assert.equal(analytics.initialize(instance, ENABLED, () => {}).dispatch("page_view"), false);
  }
});

test("silent preference removal and history cleanup failures fail closed", () => {
  const silentRemoval = browser("/pastelint/?analytics=include", "excluded");
  silentRemoval.localStorage.removeItem = () => {};
  assert.equal(analytics.initialize(silentRemoval, ENABLED, () => {}).dispatch("page_view"), false);

  for (const replaceState of [() => {}, () => { throw new Error("restricted"); }]) {
    const instance = browser("/pastelint/?analytics=include", "excluded");
    instance.history.replaceState = replaceState;
    const dispatcher = analytics.initialize(instance, ENABLED, () => {});
    instance.location.href = ORIGIN + "/pastelint/";
    assert.equal(dispatcher.dispatch("page_view"), false);
  }
});

test("eligibility is rechecked immediately before every dispatch and denial latches", () => {
  const { instance, dispatcher, events } = setup("/pastelint/");
  assert.equal(dispatcher.dispatch("tool_start"), true);
  instance.localStorage.setItem(KEY, "excluded");
  assert.equal(dispatcher.dispatch("tool_complete"), false);
  instance.localStorage.removeItem(KEY);
  assert.equal(dispatcher.dispatch("output_copy"), false);
  assert.equal(events.length, 1);
});

test("resolved integration consumes only a frozen authoritative decision", () => {
  for (const decision of [
    Object.freeze({ state: "excluded" }),
    Object.freeze({ state: "blocked" }),
    Object.freeze({ state: "unknown" }),
    { state: "included" },
    Object.freeze({ state: "included", extra: true })
  ]) {
    const instance = browser();
    const dispatcher = analytics.initializeResolved(instance, decision, ENABLED, () => {
      throw new Error("blocked decision reached sink");
    });
    assert.equal(dispatcher.dispatch("page_view"), false);
  }
});

test("resolved integration does not reinterpret or mutate raw controls", () => {
  const instance = browser("/pastelint/?analytics=exclude");
  const originalHref = instance.location.href;
  let historyCalls = 0;
  instance.history.replaceState = () => { historyCalls += 1; };
  instance.localStorage.setItem = () => { throw new Error("raw control was reinterpreted"); };
  const dispatcher = analytics.initializeResolved(
    instance,
    Object.freeze({ state: "included" }),
    ENABLED,
    () => { throw new Error("unresolved control reached sink"); }
  );
  assert.equal(dispatcher.dispatch("tool_start"), false);
  assert.equal(instance.location.href, originalHref);
  assert.equal(historyCalls, 0);
});

test("resolved integration rechecks persisted exclusion before every event", () => {
  const instance = browser();
  const events = [];
  const dispatcher = analytics.initializeResolved(
    instance,
    Object.freeze({ state: "included" }),
    ENABLED,
    (payload) => events.push(payload)
  );
  assert.equal(dispatcher.dispatch("tool_start"), true);
  instance.localStorage.setItem(KEY, "excluded");
  assert.equal(dispatcher.dispatch("tool_complete"), false);
  instance.localStorage.removeItem(KEY);
  assert.equal(dispatcher.dispatch("output_copy"), false);
  assert.equal(events.length, 1);
});

test("resolved integration fails closed when storage becomes unavailable", () => {
  const instance = browser();
  const events = [];
  const dispatcher = analytics.initializeResolved(
    instance,
    Object.freeze({ state: "included" }),
    ENABLED,
    (payload) => events.push(payload)
  );
  instance.localStorage.getItem = () => { throw new Error("restricted"); };
  assert.equal(dispatcher.dispatch("tool_start"), false);
  assert.deepEqual(events, []);
});

test("location and analytics controls are rechecked before every dispatch", () => {
  const first = setup("/pastelint/");
  first.instance.location.href = ORIGIN + "/pastelint/?analytics=exclude";
  assert.equal(first.dispatcher.dispatch("page_view"), false);

  const second = setup("/pastelint/");
  second.instance.location.href = "https://elsewhere.test/pastelint/";
  assert.equal(second.dispatcher.dispatch("page_view"), false);
});

test("payload contains exactly the two canonical fields", () => {
  const { dispatcher, events } = setup("/pastelint/second-draft.html");
  assert.equal(dispatcher.dispatch("output_copy"), true);
  assert.deepEqual(Object.keys(events[0]), ["event_type", "page_path"]);
  assert.deepEqual(events[0], {
    event_type: "output_copy",
    page_path: "/pastelint/second-draft.html"
  });
  assert.equal(Object.isFrozen(events[0]), true);
});

test("page view dispatches at most once per document", () => {
  const { dispatcher, events } = setup("/pastelint/");
  assert.equal(dispatcher.dispatch("page_view"), true);
  assert.equal(dispatcher.dispatch("page_view"), false);
  assert.equal(events.length, 1);
});

test("repeated initialization returns the same document dispatcher", () => {
  const events = [];
  const instance = browser();
  const first = analytics.initialize(instance, ENABLED, (payload) => events.push(payload));
  const second = analytics.initialize(instance, ENABLED, () => { throw new Error("replacement sink used"); });
  assert.equal(first, second);
  assert.equal(first.dispatch("page_view"), true);
  assert.equal(second.dispatch("page_view"), false);
  assert.equal(events.length, 1);
});

test("mixed standalone then resolved initialization fails closed", () => {
  const events = [];
  const instance = browser();
  const standalone = analytics.initialize(
    instance,
    ENABLED,
    (payload) => events.push(payload)
  );
  const resolved = analytics.initializeResolved(
    instance,
    Object.freeze({ state: "blocked" }),
    ENABLED,
    (payload) => events.push(payload)
  );
  assert.notEqual(standalone, resolved);
  assert.equal(resolved.dispatch("tool_start"), false);
  assert.equal(standalone.dispatch("tool_start"), false);
  assert.deepEqual(events, []);
});

test("mixed resolved then standalone initialization fails closed", () => {
  const events = [];
  const instance = browser();
  const resolved = analytics.initializeResolved(
    instance,
    Object.freeze({ state: "included" }),
    ENABLED,
    (payload) => events.push(payload)
  );
  const standalone = analytics.initialize(
    instance,
    ENABLED,
    (payload) => events.push(payload)
  );
  assert.notEqual(resolved, standalone);
  assert.equal(standalone.dispatch("tool_start"), false);
  assert.equal(resolved.dispatch("tool_start"), false);
  assert.deepEqual(events, []);
});

test("legitimate repeated operation events remain countable", () => {
  const { dispatcher, events } = setup("/pastelint/SSML_builder.html");
  assert.equal(dispatcher.dispatch("tool_start"), true);
  assert.equal(dispatcher.dispatch("tool_start"), true);
  assert.equal(dispatcher.dispatch("tool_complete"), true);
  assert.equal(dispatcher.dispatch("output_copy"), true);
  assert.equal(dispatcher.dispatch("output_copy"), true);
  assert.equal(events.length, 5);
});

test("sink failures are contained and page views are not retried", () => {
  let calls = 0;
  const { dispatcher } = setup("/pastelint/", ENABLED, null, () => {
    calls += 1;
    throw new Error("sink failed");
  });
  assert.equal(dispatcher.dispatch("page_view"), false);
  assert.equal(dispatcher.dispatch("page_view"), false);
  assert.equal(calls, 1);
  assert.doesNotThrow(() => dispatcher.dispatch("tool_start"));
});

test("module has no analytics transport, queue or automatic dispatch", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "analytics-event-dispatcher.js"),
    "utf8"
  );
  for (const forbidden of ["fetch(", "sendBeacon", "XMLHttpRequest", "new Image", "WebSocket", "workers.dev"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.equal(source.includes("event_queue"), false);
  const { events } = setup("/pastelint/");
  assert.deepEqual(events, []);
});

test("browser build exposes one immutable frozen API", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "analytics-event-dispatcher.js"),
    "utf8"
  );
  const context = vm.createContext({ URL, WeakMap, Set, Object });
  vm.runInContext(source, context, { filename: "js/analytics-event-dispatcher.js" });
  assert.equal(Object.isFrozen(context.PasteLintAnalyticsDispatcher), true);
  assert.equal(
    Object.getOwnPropertyDescriptor(context, "PasteLintAnalyticsDispatcher").writable,
    false
  );
});
