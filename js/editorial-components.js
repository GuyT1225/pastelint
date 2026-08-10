(function (root) {
  "use strict";

  const registryRequests = new Map();
  const supportedModes = new Set(["compare", "replay"]);
  const replayIntervalMs = 2000;
  const mobileReadingQuery = "(max-width: 480px)";
  const fixedMessages = {
    data: "Demonstration data unavailable",
    record: "Demonstration record unavailable",
    type: "Unsupported demonstration type",
    draft: "Demonstration not yet verified.",
    "recheck-required": "Recheck required.",
    retired: "Historical demonstration."
  };

  function loadRegistry(url) {
    if (!registryRequests.has(url)) {
      registryRequests.set(
        url,
        root.fetch(url).then((response) => {
          if (!response.ok) throw new Error("registry");
          return response.json();
        })
      );
    }
    return registryRequests.get(url);
  }

  function eventFor(record, action) {
    const expected = `Editorial Demo | ${record.id} | ${action}`;
    return record.analytics?.includes(expected) ? expected : "";
  }

  function makeButton(label, action, event, tier) {
    const control = root.document.createElement("button");
    control.type = "button";
    control.className = `editorial-demo__control editorial-demo__control--${tier}`;
    control.textContent = label;
    control.dataset.demoAction = action;
    if (event) control.dataset.statkitEvent = event;
    return control;
  }

  function setStatus(element, message) {
    const status = element.querySelector("[data-demo-runtime-status]");
    if (status) status.textContent = message;
  }

  function fail(element, message) {
    element.dataset.demoEnhanced = "failed";
    setStatus(element, message);
  }

  function renderMetadata(element, record) {
    const details = root.document.createElement("details");
    details.className = "editorial-demo__metadata";
    const summary = root.document.createElement("summary");
    summary.textContent = "Verification details";
    const event = eventFor(record, "metadata-open");
    if (event) summary.dataset.statkitEvent = event;
    const list = root.document.createElement("dl");
    const versions = record.comparison.versions;
    const rows = [
      ["Classification", "Recorded Replay"],
      ["Engine", record.engine.name],
      ["Previous engine commit", versions[0].engineCommit],
      ["Current engine commit", versions[1].engineCommit],
      ["Captured", record.captureDate],
      ["Last verified", record.lastVerified],
      ["Options", JSON.stringify(record.engine.options)],
      ["Rules", record.rules.join(", ")],
      ["Regression", record.regressions.join(", ")]
    ];
    rows.forEach(([term, value]) => {
      const dt = root.document.createElement("dt");
      const dd = root.document.createElement("dd");
      dt.textContent = term;
      dd.textContent = value;
      list.append(dt, dd);
    });
    const limitations = root.document.createElement("ul");
    record.limitations.forEach((text) => {
      const item = root.document.createElement("li");
      item.textContent = text;
      limitations.append(item);
    });
    details.append(summary, list, limitations);
    element.append(details);
  }

  function enhanceConcept(element, record) {
    const reasoning = element.querySelector("[data-demo-reasoning]");
    if (!reasoning) {
      fail(element, fixedMessages.record);
      return null;
    }
    reasoning.addEventListener("toggle", () => {
      setStatus(
        element,
        reasoning.open
          ? "Editorial reasoning expanded."
          : "Editorial reasoning collapsed."
      );
    });
    element.dataset.demoEnhanced = "true";
    setStatus(element, "Complete concept illustration available.");
    return { reasoning };
  }

  function enhanceMobileReading(element, record, panels) {
    const labels = {
      source: "Original source",
      previous: "Previous engine behavior",
      current: "Current verified behavior"
    };
    const disclosures = {};

    Object.entries(panels).forEach(([key, panel]) => {
      const heading = panel.querySelector("h3");
      const disclosure = root.document.createElement("details");
      const summary = root.document.createElement("summary");
      disclosure.className =
        `${panel.className} editorial-demo__evidence-disclosure`;
      disclosure.open = key !== "source";
      disclosure.dataset.demoEvidence = key;
      summary.textContent = heading?.textContent || labels[key];
      if (heading?.id) summary.id = heading.id;
      const event = eventFor(record, "replay-step");
      if (event) summary.dataset.statkitEvent = event;
      heading?.remove();
      disclosure.append(summary, ...Array.from(panel.childNodes));
      panel.replaceWith(disclosure);
      let ignoreInitialToggle = disclosure.open;
      disclosure.addEventListener("toggle", () => {
        if (ignoreInitialToggle) {
          ignoreInitialToggle = false;
          return;
        }
        setStatus(
          element,
          `${labels[key]} ${disclosure.open ? "expanded" : "collapsed"}.`
        );
      });
      disclosures[key] = disclosure;
    });

    element.classList.add("editorial-demo--reading");
    element.dataset.demoInteraction = "progressive-disclosure";
    renderMetadata(element, record);
    element.dataset.demoEnhanced = "true";
    setStatus(
      element,
      "Previous and current evidence are open. Original source is available."
    );
    return { disclosures, mode: "reading" };
  }

  function enhance(element, record) {
    if (record.status !== "verified") {
      fail(element, fixedMessages[record.status] || fixedMessages.record);
      return null;
    }
    if (record.classification === "concept-illustration") {
      return enhanceConcept(element, record);
    }
    if (record.classification !== "recorded-replay") {
      fail(element, fixedMessages.type);
      return null;
    }
    if (!record.componentModes?.every((mode) => supportedModes.has(mode))) {
      fail(element, fixedMessages.type);
      return null;
    }

    const fields = {
      source: element.querySelector('[data-demo-field="source"]'),
      previous: element.querySelector('[data-demo-field="previous-output"]'),
      current: element.querySelector('[data-demo-field="output"]')
    };
    const panels = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [
        key,
        field?.closest(".editorial-demo__state")
      ])
    );
    if (Object.values(panels).some((panel) => !panel)) {
      fail(element, fixedMessages.record);
      return null;
    }
    if (typeof root.matchMedia === "function" &&
        root.matchMedia(mobileReadingQuery).matches) {
      return enhanceMobileReading(element, record, panels);
    }

    const state = {
      index: 0,
      mode: "compare",
      timer: null,
      playing: false,
      steps: record.steps.slice()
    };
    const controls = root.document.createElement("div");
    controls.className = "editorial-demo__controls";
    controls.setAttribute("aria-label", "Recorded Replay controls");
    const progress = root.document.createElement("p");
    progress.className = "editorial-demo__progress";
    progress.setAttribute("aria-live", "polite");
    const actions = [
      ["Step through the repair", "play", "replay-start", "primary", "Playback"],
      ["Pause", "pause", "", "tertiary", "Playback"],
      ["Previous", "previous", "replay-step", "secondary"],
      ["Next", "next", "replay-step", "secondary"],
      ["Start over", "restart", "reset", "secondary"],
      ["Show source", "source", "replay-step", "tertiary", "View"],
      ["Show repaired result", "final", "replay-complete", "tertiary", "View"],
      ["Compare side by side", "compare", "compare-toggle", "tertiary", "View"]
    ];
    const actionButtons = {};
    const controlGroups = new Map();
    actions.forEach(([label, action, analytics, tier, declaredGroup]) => {
      const groupName =
        declaredGroup || (tier === "secondary" ? "Navigation" : "Playback");
      if (!controlGroups.has(groupName)) {
        const group = root.document.createElement("div");
        group.className = "editorial-demo__control-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", groupName);
        controlGroups.set(groupName, group);
        controls.append(group);
      }
      const control = makeButton(
        label,
        action,
        analytics ? eventFor(record, analytics) : "",
        tier
      );
      if (action === "compare") control.setAttribute("aria-pressed", "false");
      actionButtons[action] = control;
      controlGroups.get(groupName).append(control);
    });

    function stop() {
      if (state.timer !== null) root.clearInterval(state.timer);
      state.timer = null;
      state.playing = false;
    }

    function updateDisabled() {
      actionButtons.previous.disabled = state.mode !== "replay" || state.index === 0;
      actionButtons.next.disabled =
        state.mode !== "replay" || state.index === state.steps.length - 1;
      actionButtons.pause.disabled = !state.playing;
    }

    function showPanel(key, visible) {
      panels[key].hidden = !visible;
      panels[key].setAttribute("aria-hidden", String(!visible));
    }

    function renderCompare(message) {
      state.mode = "compare";
      showPanel("source", false);
      showPanel("previous", true);
      showPanel("current", true);
      progress.textContent = "Comparing previous engine behavior with current verified behavior.";
      updateDisabled();
      setStatus(element, message || "Comparison displayed in a stacked layout.");
    }

    function renderStep(index, message) {
      state.mode = "replay";
      state.index = Math.max(0, Math.min(index, state.steps.length - 1));
      const step = state.steps[state.index];
      const stateMessage = step.id === "source"
        ? "Showing the original source."
        : step.versionId === "previous"
          ? "Showing the previous engine output."
          : "Showing the current verified output.";
      showPanel("source", step.id === "source");
      showPanel("previous", step.versionId === "previous");
      showPanel("current", step.versionId === "current");
      progress.textContent =
        `${step.label} — ${state.index + 1} of ${state.steps.length}`;
      if (state.index === state.steps.length - 1) stop();
      updateDisabled();
      setStatus(element, message || stateMessage);
    }

    function act(action) {
      if (action === "play") {
        stop();
        state.playing = true;
        renderStep(0, "Showing the original source.");
        actionButtons.pause.disabled = false;
        state.timer = root.setInterval(() => {
          renderStep(state.index + 1);
        }, replayIntervalMs);
      } else if (action === "pause") {
        stop();
        updateDisabled();
        setStatus(element, `Replay paused at ${state.steps[state.index].label}.`);
      } else if (action === "restart" || action === "source") {
        stop();
        renderStep(0, "Showing the original source.");
      } else if (action === "previous") {
        stop();
        renderStep(state.index - 1);
      } else if (action === "next") {
        stop();
        renderStep(state.index + 1);
      } else if (action === "final") {
        stop();
        renderStep(state.steps.length - 1, "Showing the current verified output.");
      }
    }

    controls.addEventListener("click", (event) => {
      const action = event.target?.dataset?.demoAction;
      if (!action || action === "compare") return;
      act(action);
    });
    actionButtons.compare.addEventListener("click", () => {
      const active =
        actionButtons.compare.getAttribute("aria-pressed") !== "true";
      actionButtons.compare.setAttribute("aria-pressed", String(active));
      actionButtons.compare.textContent = active
        ? "Stack comparison"
        : "Compare side by side";
      element.classList.toggle("editorial-demo--side-by-side", active);
      renderCompare(active
        ? "Comparison displayed side by side."
        : "Comparison displayed in a stacked layout.");
    });

    element.append(controls, progress);
    renderMetadata(element, record);
    element.dataset.demoEnhanced = "true";
    renderCompare("Comparison displayed in a stacked layout.");
    return { state, act, renderCompare, renderStep };
  }

  async function initializeRoot(element) {
    const registryUrl =
      element.dataset.demoRegistry ||
      root.document.documentElement.dataset.demoRegistry ||
      "data/editorial-demonstrations.json";
    try {
      const registry = await loadRegistry(registryUrl);
      const record = registry?.demonstrations?.find(
        (item) => item.id === element.dataset.demoId
      );
      if (!record) {
        fail(element, fixedMessages.record);
        return null;
      }
      return enhance(element, record);
    } catch {
      fail(element, fixedMessages.data);
      return null;
    }
  }

  function initializeAll() {
    root.document.querySelectorAll("[data-demo-id]").forEach(initializeRoot);
  }

  root.PasteLintEditorialComponents = {
    initializeAll,
    initializeRoot,
    enhance,
    loadRegistry,
    eventFor,
    mobileReadingQuery,
    fixedMessages
  };

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", initializeAll);
  } else {
    initializeAll();
  }
})(typeof window !== "undefined" ? window : globalThis);
