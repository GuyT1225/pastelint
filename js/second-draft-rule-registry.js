(function (root) {
  "use strict";

  const DEFAULT_REGISTRY_URL = "data/second-draft-rules.json";
  const SCHEMA_VERSION = "1.0.0";
  const EMPTY_REGISTRY = {
    schemaVersion: SCHEMA_VERSION,
    registryVersion: null,
    rules: []
  };

  const REQUIRED_RULE_FIELDS = [
    "id",
    "slug",
    "name",
    "category",
    "type",
    "status",
    "summary",
    "rationale",
    "triggerDescription",
    "changeDescription",
    "confidence",
    "automation",
    "source",
    "examples",
    "counterexamples",
    "tags"
  ];

  const VALID_CATEGORIES = new Set([
    "clarity",
    "compression",
    "repetition",
    "structure",
    "reader-orientation",
    "preservation",
    "rhythm"
  ]);

  const VALID_TYPES = new Set([
    "mechanical",
    "deterministic-editorial",
    "interpretive-editorial",
    "advisory",
    "preservation-rule"
  ]);

  const VALID_STATUSES = new Set([
    "active",
    "inactive",
    "research-only",
    "deprecated"
  ]);

  const VALID_CONFIDENCE = new Set(["high", "medium", "contextual"]);

  const VALID_AUTOMATION = new Set([
    "eligible",
    "constrained",
    "suggestion-only",
    "explanation-only",
    "research-only",
    "deprecated"
  ]);

  let currentRegistry = EMPTY_REGISTRY;
  let activeRuleLookup = new Map();
  let loadPromise = null;
  let status = {
    state: "idle",
    source: "none",
    errorCode: null
  };

  function validateRegistry(data) {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        valid: false,
        errors: ["registry-not-object"]
      };
    }

    if (data.schemaVersion !== SCHEMA_VERSION) {
      errors.push("unsupported-schema-version");
    }

    if (
      data.registryVersion !== null &&
      typeof data.registryVersion !== "string"
    ) {
      errors.push("invalid-registry-version");
    }

    if (!Array.isArray(data.rules)) {
      errors.push("rules-not-array");
      return {
        valid: errors.length === 0,
        errors
      };
    }

    const ids = new Set();
    const slugs = new Set();
    const activePurposes = new Set();

    data.rules.forEach((rule, index) => {
      const prefix = `rule-${index}`;

      if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        errors.push(`${prefix}-not-object`);
        return;
      }

      REQUIRED_RULE_FIELDS.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(rule, field)) {
          errors.push(`${prefix}-missing-${field}`);
        }
      });

      validateRuleString(rule, "id", prefix, errors);
      validateRuleString(rule, "slug", prefix, errors);
      validateRuleString(rule, "name", prefix, errors);
      validateRuleString(rule, "summary", prefix, errors);
      validateRuleString(rule, "rationale", prefix, errors);
      validateRuleString(rule, "triggerDescription", prefix, errors);
      validateRuleString(rule, "changeDescription", prefix, errors);

      validateEnum(rule, "category", VALID_CATEGORIES, prefix, errors);
      validateEnum(rule, "type", VALID_TYPES, prefix, errors);
      validateEnum(rule, "status", VALID_STATUSES, prefix, errors);
      validateEnum(rule, "confidence", VALID_CONFIDENCE, prefix, errors);
      validateEnum(rule, "automation", VALID_AUTOMATION, prefix, errors);

      if (typeof rule.id === "string") {
        if (ids.has(rule.id)) errors.push(`${prefix}-duplicate-id`);
        ids.add(rule.id);
      }

      if (typeof rule.slug === "string") {
        if (slugs.has(rule.slug)) errors.push(`${prefix}-duplicate-slug`);
        slugs.add(rule.slug);
      }

      if (rule.status === "active") {
        const purpose = [
          rule.category,
          rule.type,
          rule.triggerDescription,
          rule.changeDescription
        ].join("|");

        if (activePurposes.has(purpose)) {
          errors.push(`${prefix}-duplicate-active-semantic-purpose`);
        }

        activePurposes.add(purpose);
      }

      if (!rule.source || typeof rule.source !== "object" || Array.isArray(rule.source)) {
        errors.push(`${prefix}-invalid-source`);
      } else {
        validateRuleString(rule.source, "type", `${prefix}-source`, errors);
        validateRuleString(rule.source, "reference", `${prefix}-source`, errors);
      }

      validateArray(rule, "examples", prefix, errors);
      validateArray(rule, "counterexamples", prefix, errors);
      validateStringArray(rule, "tags", prefix, errors);
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function validateRuleString(rule, field, prefix, errors) {
    if (typeof rule[field] !== "string" || !rule[field].trim()) {
      errors.push(`${prefix}-invalid-${field}`);
    }
  }

  function validateEnum(rule, field, allowed, prefix, errors) {
    if (!allowed.has(rule[field])) {
      errors.push(`${prefix}-invalid-${field}`);
    }
  }

  function validateArray(rule, field, prefix, errors) {
    if (!Array.isArray(rule[field])) {
      errors.push(`${prefix}-invalid-${field}`);
    }
  }

  function validateStringArray(rule, field, prefix, errors) {
    if (!Array.isArray(rule[field]) || rule[field].some((item) => typeof item !== "string")) {
      errors.push(`${prefix}-invalid-${field}`);
    }
  }

  function useRegistry(data, source) {
    const validation = validateRegistry(data);

    if (!validation.valid) {
      return useFallback("invalid-registry");
    }

    currentRegistry = data;
    activeRuleLookup = new Map(
      data.rules
        .filter((rule) => rule.status === "active")
        .map((rule) => [rule.id, rule])
    );
    status = {
      state: "ready",
      source: source || "json",
      errorCode: null
    };

    return currentRegistry;
  }

  function useFallback(errorCode) {
    currentRegistry = EMPTY_REGISTRY;
    activeRuleLookup = new Map();
    status = {
      state: "unavailable",
      source: "fallback",
      errorCode: errorCode || "load-failed"
    };

    return currentRegistry;
  }

  function load(url) {
    if (loadPromise) return loadPromise;

    if (typeof root.fetch !== "function") {
      return Promise.resolve(useFallback("fetch-unavailable"));
    }

    status = {
      state: "loading",
      source: "network",
      errorCode: null
    };

    loadPromise = root.fetch(url || DEFAULT_REGISTRY_URL, { cache: "no-cache" })
      .then((response) => {
        if (!response || !response.ok) {
          throw new Error("registry-fetch-failed");
        }

        return response.json();
      })
      .then((data) => useRegistry(data, "json"))
      .catch(() => useFallback("load-failed"));

    return loadPromise;
  }

  function getRule(id) {
    return activeRuleLookup.get(id) || null;
  }

  function getActiveRules() {
    return Array.from(activeRuleLookup.values());
  }

  function getAllRules() {
    return currentRegistry.rules.slice();
  }

  function getStatus() {
    return { ...status };
  }

  const api = {
    load,
    getRule,
    getActiveRules,
    getAllRules,
    getStatus,
    useRegistry,
    useFallback,
    validateRegistry
  };

  root.PasteLintSecondDraftRuleRegistry = api;

  if (root.document && typeof root.document.addEventListener === "function") {
    root.document.addEventListener("DOMContentLoaded", () => {
      api.load();
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
