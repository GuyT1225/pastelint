(function (root) {
  "use strict";

  const registryRequests = new Map();
  const supportedModes = new Set(["compare", "replay"]);
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

  function enhance(element, record) {
    if (record.classification !== "recorded-replay") {
      fail(element, fixedMessages.type);
      return null;
    }
    if (record.status !== "verified") {
      fail(element, fixedMessages[record.status] || fixedMessages.record);
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
      ["Play comparison", "play", "replay-start", "primary"],
      ["Previous", "previous", "replay-step", "secondary"],
      ["Next", "next", "replay-step", "secondary"],
      ["Restart", "restart", "reset", "secondary"],
      ["Pause", "pause", "", "tertiary"],
      ["Show source", "source", "replay-step", "tertiary"],
      ["Show current output", "final", "replay-complete", "tertiary"],
      ["Use side-by-side layout", "compare", "compare-toggle", "tertiary"]
    ];
    const actionButtons = {};
    actions.forEach(([label, action, analytics, tier]) => {
      const control = makeButton(
        label,
        action,
        analytics ? eventFor(record, analytics) : "",
        tier
      );
      if (action === "compare") control.setAttribute("aria-pressed", "false");
      actionButtons[action] = control;
      controls.append(control);
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
      setStatus(element, message || progress.textContent);
    }

    function renderStep(index, message) {
      state.mode = "replay";
      state.index = Math.max(0, Math.min(index, state.steps.length - 1));
      const step = state.steps[state.index];
      showPanel("source", step.id === "source");
      showPanel("previous", step.versionId === "previous");
      showPanel("current", step.versionId === "current");
      progress.textContent =
        `${step.label}. Step ${state.index + 1} of ${state.steps.length}.`;
      updateDisabled();
      setStatus(element, message || progress.textContent);
      if (state.index === state.steps.length - 1) stop();
    }

    function act(action) {
      if (action === "play") {
        stop();
        state.playing = true;
        renderStep(0, "Original source. Replay started.");
        actionButtons.pause.disabled = false;
        state.timer = root.setInterval(() => {
          renderStep(state.index + 1);
        }, 1100);
      } else if (action === "pause") {
        stop();
        updateDisabled();
        setStatus(element, `Replay paused at ${state.steps[state.index].label}.`);
      } else if (action === "restart" || action === "source") {
        stop();
        renderStep(0, action === "restart"
          ? "Replay restarted at Original source."
          : "Original source shown.");
      } else if (action === "previous") {
        stop();
        renderStep(state.index - 1);
      } else if (action === "next") {
        stop();
        renderStep(state.index + 1);
      } else if (action === "final") {
        stop();
        renderStep(state.steps.length - 1, "Current verified behavior shown.");
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
        ? "Use stacked layout"
        : "Use side-by-side layout";
      element.classList.toggle("editorial-demo--side-by-side", active);
      renderCompare(active
        ? "Side-by-side previous and current comparison."
        : "Stacked previous and current comparison.");
    });

    element.append(controls, progress);
    renderMetadata(element, record);
    element.dataset.demoEnhanced = "true";
    renderCompare("Recorded Replay ready. Previous and current behavior shown.");
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
    fixedMessages
  };

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", initializeAll);
  } else {
    initializeAll();
  }
})(typeof window !== "undefined" ? window : globalThis);
