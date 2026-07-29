# Editorial Components v1

## 1. Milestone definition

Editorial Components v1 is PasteLint's reusable editorial presentation and evidence layer. It gives publications a consistent way to show verified product behavior without copying engine logic, simulating unsupported capability, or making interaction necessary for comprehension.

This is an architecture contract. The component runtime, styles, Demonstration Library, validator, adapters, demonstration records, and publication integrations described below do not exist until their separate implementation cycles are reviewed and shipped.

## 2. Purpose

The milestone exists to turn selected verified behavior into canonical editorial evidence that may be reused by Engine Room, the Editorial Research Journal, Sources & Case Studies, the Editorial Constitution, the Second Draft Handbook, product documentation, and educational or launch media.

The objective is trustworthy explanation, not novelty. A component should help a reader distinguish source, product output, interpretation, provenance, and limitation. It must not make a fixed example look like proof of universal capability.

## 3. Core trust constraint

**Never simulate engine capability.**

An editorial surface must not:

- contain a simplified imitation of a production engine;
- copy transformation rules into an article or component;
- manually animate an output the engine did not produce;
- label conceptual or captured output as live execution;
- broaden a claim beyond the verified fixture and adapter contract;
- hide limitations behind animation or product-like styling; or
- silently substitute a replay when a Live Engine adapter is unavailable.

Every demonstration has exactly one evidence classification: Live Engine, Recorded Replay, or Concept Illustration.

## 4. Project constraints

Editorial Components preserve the existing PasteLint platform:

- browser-only, framework-free HTML, CSS, and JavaScript;
- GitHub Pages compatibility;
- no login, uploads, backend, private API, remote model, or text-processing service;
- no build step or package manager requirement in v1;
- pasted or generated text remains local;
- existing Light, Dark, and Terminal themes;
- responsive presentation, keyboard access, visible focus, and reduced-motion support;
- complete readable static fallback;
- no duplicated production logic; and
- fixed StatsKit events that never contain user or document content.

## 5. Relationship to Workflow v2

Workflow v2 remains a two-lane system. Editorial Components add a cross-cutting evidence layer between verified technical proof and optional publication:

> Technical lane: Problem → rule or engine hypothesis → implementation → regression tests → manual QA → technical documentation → ship verified behavior

> Evidence layer: Verified behavior → canonical demonstration → verification state → reusable editorial asset

> Knowledge lane: Capture → primary destination decision → brief → publish when warranted → review → update, promote, supersede, or retire

The evidence layer never delays ready engine work. Not every engine change needs a demonstration, not every demonstration needs an article, and not every article needs a component. Demonstration capture and publication integration may be separate commits.

Editorial Components are evidence infrastructure, not a publication track and not a replacement for Internal Documentation, Engine Room, Editor's Desk, Sources & Case Studies, the Editorial Constitution, or the Second Draft Handbook.

## 6. Evidence-layer architecture

A canonical demonstration is a durable bridge between technical verification and editorial use:

1. Production behavior is implemented and verified independently.
2. An editorial decision determines whether a reusable demonstration is warranted.
3. The demonstration records its provenance, dependencies, fixture, limitations, and verification.
4. A publication consumes the canonical record through a supported presentation mode.
5. Later engine or component changes trigger dependency-aware rechecking.
6. Promotion into the Constitution or Handbook remains a separate maturity decision.

One canonical record may support several publication surfaces. Its evidence must not be manually recreated in each article.

## 7. Demonstration classifications

### Live Engine

Visible label:

> Live Engine · Runs in your browser

A Live Engine component calls an approved production adapter at interaction time. The adapter routes validated options to the actual production API and returns the current production result in a display-safe shape. The component contains no article-specific transformation logic or authored replacement output.

A Live Engine:

- accepts only inputs and options in its adapter contract;
- uses the production rule order and limits;
- fails honestly when the adapter or engine cannot execute;
- remains visibly unavailable instead of fabricating a result;
- sends no input, output, findings text, or errors containing user text to analytics; and
- must be rechecked when its engine module or adapter changes.

### Recorded Replay

Visible label:

> Recorded Replay · Captured from PasteLint engine commit `<hash>`

A Recorded Replay stores an exact sequence captured from a real production execution. It contains an exact verified input and final output and may include verified intermediate steps. It accepts no arbitrary reader text.

A Recorded Replay identifies its engine module and commit, capture and verification dates, options, rules, regressions, declared dependencies, and limitations. It becomes `recheck-required` when a relevant dependency changes. It must not be silently edited in article markup or presented as current live execution.

A static before-and-after comparison is a presentation mode of Recorded Replay, not a fourth classification.

### Concept Illustration

Visible label:

> Concept Illustration · Does not execute PasteLint

A Concept Illustration explains architecture, workflow, reasoning, evidence, or editorial theory. It executes no engine and claims no product output. It avoids Run or Execute language, fake progress, fake confidence, and product-editor styling that could imply live behavior.

It may use explanatory text and diagrams, but it must not present manually written text as PasteLint output.

## 8. Component presentation modes

Classification describes provenance. Mode describes presentation.

### Replay

Replay supports Play, Pause, Restart, Step forward, Step backward, complete source, complete output, metadata disclosure, reduced-motion operation, and a complete text alternative. No required information may depend on timing.

### Compare

Compare presents two verified states, such as source/output, cleaned/revised, plain text/SSML, engine version before/after, or two supported option results. Labels must identify both states and must not imply one is universally superior.

### Deferred: Inspect

Inspect may eventually expose production-supported findings, rule activation, or rationale. It must not invent explanation, severity, or confidence after the fact.

### Deferred: Experiment

Experiment may eventually accept reader text through a narrow Live Engine adapter. It remains deferred until adapter allowlisting, privacy, accessibility, failure handling, and validation are proven.

## 9. Initial v1 scope

The smallest viable v1 contains:

- one progressive-enhancement shell;
- Recorded Replay and Compare modes;
- one canonical demonstration;
- a complete static fallback;
- a central Demonstration Library with schema validation;
- provenance and verification metadata;
- keyboard, status-message, focus, and reduced-motion behavior;
- fixed component analytics events; and
- responsive Light, Dark, and Terminal presentation.

## 10. Explicit deferred scope

V1 excludes:

- arbitrary user-text experiments;
- Inspect and Experiment modes;
- embedded full-product interfaces;
- a Second Draft Live adapter;
- a broad animation framework;
- component frameworks, routers, template languages, package managers, or build steps;
- Canvas-only output;
- Custom Elements without a later demonstrated need;
- article-specific engine rules; and
- automatic retrofitting of older articles.

## 11. Minimal proposed file architecture

### `js/editorial-components.js`

Justified for the first implementation. It will discover roots by `data-demo-id`, load canonical data, verify supported modes, preserve or enhance static fallback, manage Replay and Compare state, support keyboard and reduced motion, show honest failures, and emit fixed analytics events. It contains no transformation rules.

### `css/editorial-components.css`

Justified for the first implementation. It will provide restrained editorial-figure styling, classification labels, captions, metadata disclosure, focus states, theme support, mobile layout, reduced-motion rules, and static fallback styling. It must not resemble a SaaS dashboard.

### `data/editorial-demonstrations.json`

Justified for the first implementation. It will be the canonical source for small v1 demonstration fixtures, provenance, dependencies, verification, accessibility declarations, analytics actions, limitations, and destinations.

### `scripts/validate-demonstrations.mjs`

Justified for the first implementation. It will validate schema, identity, classification, lifecycle, type-specific provenance, commit and date formats, fixed analytics, accessibility declarations, limitations, destinations, adapter references, privacy exclusions, and article fallback drift.

### `js/editorial-engine-adapters.js`

Deferred. Recorded Replay and Compare do not need an adapter layer. This file should be introduced only with the first Live Engine cycle, when it can contain a real allowlist and option contract rather than speculative infrastructure.

## 12. Demonstration Library schema v1

The top-level JSON shape is:

```json
{
  "schemaVersion": 1,
  "demonstrations": []
}
```

Each demonstration uses this conceptual shape:

```json
{
  "id": "DEMO-001",
  "slug": "line-structure-survives-revision",
  "title": "Line structure survives revision",
  "classification": "recorded-replay",
  "status": "verified",
  "componentModes": ["compare", "replay"],
  "summary": "A bounded statement of what the fixture demonstrates.",
  "engine": {
    "name": "Second Draft",
    "module": "js/second-draft.js",
    "commit": "abcdef1",
    "adapter": null,
    "options": {}
  },
  "fixture": {
    "id": "second-draft-structure-user-fixture",
    "input": "Exact input",
    "output": "Exact output"
  },
  "steps": [],
  "rules": ["SD-STRUCTURE-001"],
  "regressions": ["SecondDraft structure preservation"],
  "captureDate": "YYYY-MM-DD",
  "lastVerified": "YYYY-MM-DD",
  "verification": {
    "method": ["regression", "browser-qa"],
    "dependencies": []
  },
  "limitations": [],
  "accessibility": {
    "staticFallback": true,
    "reducedMotion": true,
    "textAlternative": true
  },
  "analytics": [],
  "destinations": [],
  "notes": null
}
```

`status` is the single lifecycle and publication-permission state. A duplicate `verification.status` is intentionally omitted because two status fields can disagree. The `verification` object records how and against what the current status was established.

Small fixtures belong in the central registry so identity and provenance remain inspectable together. A future schema review may permit referenced fixture files when combined input, output, and serialized steps exceed 8 KB or a replay exceeds 20 steps. V1 does not implement that extension.

Commit hashes use lowercase hexadecimal Git abbreviations of at least seven characters. Engine options are stored as an exact JSON object using production option names and values. Steps are ordered objects with a stable `id`, an accessible `label`, a complete resulting `text` state, and optional rule references; they are captured evidence, not hand-authored transformation instructions.

Destinations use objects containing a fixed publication `surface`, a manifest-compatible `slug` where applicable, and the fallback selector needed for drift validation. Retired records stay in the registry and may retain their historical destinations.

Schema migration is explicit: validators accept only the version they implement. A future version requires a documented migration and may not silently reinterpret v1 records.

## 13. Common required fields

Every demonstration requires:

- `id`, `slug`, `title`, `classification`, `status`, `componentModes`, and `summary`;
- `limitations`, including at least one honest boundary;
- `accessibility.staticFallback`, `accessibility.reducedMotion`, and `accessibility.textAlternative`;
- fixed `analytics` action declarations;
- `destinations`, which may be empty for a draft or a verified pre-publication asset;
- `verification.method` and declared dependencies appropriate to status; and
- `notes`, which may be null.

Allowed classifications are `live-engine`, `recorded-replay`, and `concept-illustration`. Allowed statuses are `draft`, `verified`, `recheck-required`, and `retired`.

## 14. Type-specific fields

### Live Engine

Live Engine requires `engine.name`, `engine.module`, an approved `engine.adapter`, exact allowed `engine.options`, privacy review, adapter failure behavior, and at least one regression reference. It must not store an authored fixture output as a runtime fallback.

### Recorded Replay

Recorded Replay requires engine name, module, commit, exact options, fixture ID, exact input and output, capture date, last verification date, verification methods, rules when applicable, regression references, declared dependencies, and limitations. Steps are optional, but any supplied steps must come from the captured execution.

A draft Recorded Replay may temporarily use null output, commit, capture date, or last-verification date while capture is incomplete. It cannot advance to `verified`, appear in a publication, or be presented as engine evidence until every required provenance field is populated and validated.

### Concept Illustration

Concept Illustration requires a conceptual subject and text alternative. `engine`, `fixture`, `rules`, `regressions`, `captureDate`, and `lastVerified` are null or absent unless they are plainly labeled references rather than execution provenance. It must not declare engine-output steps or a Live/Replay control vocabulary.

## 15. Version model

The library schema version describes record interpretation. Demonstration identity is stable by `id`; titles, summaries, and destinations may evolve through reviewed changes. Engine commits identify provenance rather than serving as a second demonstration version number.

A materially different fixture, claim boundary, classification, or engine behavior requires either explicit re-verification of the existing demonstration or a new demonstration ID when continuity would mislead readers.

## 16. Verification states

- **Draft:** incomplete and not publication-ready.
- **Verified:** provenance, exact output, relevant regressions, fallback, accessibility, privacy, and presentation QA have passed; publication use is permitted.
- **Recheck required:** one or more declared dependencies or required checks changed; current publication use must not imply present verification.
- **Retired:** superseded, removed, or no longer representative; new publication use is prohibited.

Only `verified` demonstrations may be introduced into new publications.

## 17. Invalidation rules

Rechecking is required when a declared dependency changes, including:

- the referenced engine module or rule;
- an approved adapter or option contract;
- the fixture, captured output, or replay steps;
- a relevant regression;
- component rendering or state behavior;
- the library schema or validator interpretation;
- fallback markup or drift-validation behavior;
- accessibility behavior; or
- a privacy boundary.

Not every engine commit invalidates every demonstration. Dependencies are declared so review can remain targeted.

The validator can automatically detect malformed records, missing references, changed fallback text, unsupported adapters, unsafe analytics, invalid dates or hashes, missing accessibility declarations, and records marked verified without required fields. A future repository-diff check may flag declared module, rule, regression, or component-file changes. Human review remains necessary for claim boundaries, visual over-promise, semantic accuracy, accessibility quality, and whether the fixture still represents current behavior.

The maintainer responsible for the affected engine or component marks the record `recheck-required` in the same change when practical. Re-verification updates `lastVerified`, verification methods and dependencies, and the captured result only after real execution and QA.

Publication pages encountering a non-verified record preserve the readable fallback but must replace interactive controls with an honest `Recheck required` or `Historical demonstration` notice. They must not silently show stale evidence as current.

## 18. Retirement rules

A demonstration is retired when its behavior is removed, its evidence is superseded, its claim is no longer representative, or maintaining it would mislead readers.

Retired records remain historically legible with provenance, former destinations, retirement date, reason, and replacement ID when one exists. Existing historical publications may retain a visibly labeled static replay, but the demonstration cannot power new current-capability claims.

## 19. No-duplicated-logic governance

Components may call approved production APIs, validate and route options, and normalize result shape for display. They may not rewrite text, copy rule fragments, add article-specific substitutions, infer findings absent from production metadata, or fabricate a fallback result.

Code review asks:

1. Does any component, adapter, article script, or fixture generator contain transformation logic?
2. Was Replay output captured from the named production commit?
3. Does a Live component call only an allowlisted production API?
4. Does the adapter validate and route rather than rewrite?
5. Can an unavailable Live engine fail without substituting authored output?
6. Do labels distinguish Live, Replay, and Concept states?
7. Are article claims narrower than or equal to the verified fixture and adapter contract?
8. Are source, output, interpretation, and limitation visibly distinct?

## 20. Accessibility contract

Every component must provide:

- semantic `<figure>` and `<figcaption>` structure where appropriate;
- a visible classification label and clear title;
- explicit source and output labels;
- semantic buttons with screen-reader names;
- complete keyboard operation and logical focus order;
- visible focus states and touch targets;
- polite status messages for state changes;
- complete source, output, and text alternatives;
- no reliance on color alone;
- sufficient contrast in all themes;
- no horizontal text overflow;
- no required timing-dependent interaction;
- complete static fallback when JavaScript fails; and
- honest data-load and adapter-unavailable messages.

The article must remain understandable if the reader never interacts.

## 21. Reduced-motion contract

When `prefers-reduced-motion: reduce` is active, Replay does not auto-play or animate transitions. The reader can step through states, restart, and inspect complete source and output. All explanation available during animation remains available as text.

Pause and restart are required whenever motion exists. No control or evidence disappears because animation is disabled.

## 22. Static fallback contract

Article integration uses a progressive-enhancement root such as:

```html
<figure class="editorial-demo" data-demo-id="DEMO-001">
  <!-- Complete readable static fallback -->
</figure>
```

The fallback contains classification, title, complete source, complete output, caption, core takeaway, and a relevant limitation. JavaScript may add controls and synchronized state, but it must not erase the publication's only readable evidence.

Exact fixture text is deliberately duplicated between the canonical registry and article HTML in v1 because no-JavaScript readability is more important than eliminating duplication. The registry remains the evidence source; article HTML remains the publication source. The validator reads declared destination files and compares normalized classification, title, source, output, and limitation text against the canonical record. A mismatch fails validation or requires the demonstration to move to `recheck-required`.

## 23. Analytics contract

V1 permits only:

- `Editorial Demo | <demo-id> | replay-start`
- `Editorial Demo | <demo-id> | replay-complete`
- `Editorial Demo | <demo-id> | replay-step`
- `Editorial Demo | <demo-id> | compare-toggle`
- `Editorial Demo | <demo-id> | metadata-open`
- `Editorial Demo | <demo-id> | reset`

Experiment events remain invalid until Experiment exists. Demo IDs and actions are fixed registry values. Replay completion is emitted when the final captured state is reached, not as a claim that the reader understood it.

Analytics indicate component activation and control use. They do not prove comprehension, agreement, engine quality, editorial quality, conversion, or unique-person behavior.

## 24. Privacy contract

Analytics never contain user input, fixture text, source or output snippets, engine findings containing text, SSML, names, contact details, query strings, arbitrary URLs, user-controlled labels, identifiers, or error messages containing document content.

Live inputs and outputs remain in the browser. Recorded fixtures are public canonical evidence, but their text is still excluded from event values. Failures use fixed categories such as `data-unavailable` or `adapter-unavailable`; they do not transmit exception messages that may contain content.

## 25. Engine exposure findings

### PasteLint Clean

`window.PasteLintCleanEngine.runPasteLintCleanup` is DOM-independent and returns a stable object containing source, cleaned text, change state, changes, warnings, analysis, and engine metadata. Options are passed explicitly. It is the strongest candidate for the first narrow Live adapter.

### Second Draft

`reviseSecondDraft()` is deterministic and directly callable inside the current regression harness, but the production file installs page listeners at load time, captures DOM elements in its controller, and does not expose a supported browser API. Loading it in an article would create controller assumptions. V1 must not refactor it solely to make an article interactive.

### SSML Builder

The file contains deterministic cleaning and escaping helpers, but it is controller-bound, reads several page elements, maintains page state, and exposes no supported browser adapter. A future narrow adapter might isolate escaping or wrapping only after a separate engine-boundary review. It remains deferred.

### Text Analyzer

`window.PasteLintAnalyzer` exposes deterministic analysis functions. Some finding objects contain source excerpts, creating display and analytics privacy boundaries. A future Inspect adapter could expose only production-supported finding categories and fixed explanations after a dedicated review. Inspect is not part of v1.

### Second Draft rule registry

`window.PasteLintSecondDraftRuleRegistry` exposes metadata and safe fallback behavior. It describes engine behavior but does not execute transformations. Components may reference validated rule metadata; they must not treat registry entries as executable rules.

## 26. First canonical demonstration

`DEMO-001`, **Line structure survives revision**, is specified but not created.

- Classification: `recorded-replay`
- Modes: `compare`, `replay`
- Engine: Second Draft at the exact committed structure-preservation version
- Rule: `SD-STRUCTURE-001`
- Fixture:

```text
Calendar feeds or event links
Desired go-live timeline
Happy to schedule a quick call if that would be easier.
Thanks,
Guy
```

The output must be captured from the committed production engine and verified against the regression fixture. It must not be assumed from this architecture document or manually authored as a substitute.

Supporting evidence includes the structure regression, browser QA, copy-output QA, exact SSML transfer, architecture documentation, and editorial rulebook.

The claim is bounded: this fixture demonstrates one tested preservation behavior. It does not prove universal document understanding, Markdown support, arbitrary table, poetry, or code preservation, or that every newline is semantic. It shows that preservation is safer when structure is recognized or uncertain.

Primary destination: the future Engine Room article **Line Breaks Are Part of the Meaning**.

## 27. First Live Engine candidate

`DEMO-002`, **Remove an accidental repeated word**, is specified but not created.

- Classification: `live-engine`
- Engine API: `window.PasteLintCleanEngine.runPasteLintCleanup`
- Example input: `Please send the the revised schedule.`
- Purpose: prove that an editorial page can call the actual narrow, DOM-independent production engine without duplicating transformation logic.

The later implementation must calculate the result through the production engine. It must not store an authored result as a runtime substitute. This candidate follows DEMO-001 and the first publication integration.

## 28. Publication-surface roles

- **Engine Room:** product change, rules, boundaries, and verification; natural home for Live Engine, Recorded Replay, Compare, and later limited Inspect.
- **Editorial Research Journal:** broader editorial problem and restrained implications; components support rather than replace the argument.
- **Sources & Case Studies:** external evidence and observed cases; external source, PasteLint output, and editorial interpretation remain distinct.
- **Editorial Constitution:** mature durable principles only; components are used sparingly after repeated verification.
- **Second Draft Handbook:** stable instructional assets, examples, exercises, and repeatable tests; publication elsewhere does not automatically authorize promotion.

## 29. Roadmap position

1. Ship and production-smoke structure preservation.
2. Approve and ship this architecture.
3. Implement Demonstration Library validation and the shared Replay/Compare shell.
4. Capture and verify DEMO-001.
5. Integrate DEMO-001 into **Line Breaks Are Part of the Meaning**.
6. Publish and production-smoke the article.
7. Review component analytics after an appropriate window.
8. Implement DEMO-002 as the first Live Engine proof.
9. Assess a limited Inspect mode.
10. Defer Experiment until adapters, privacy, failure handling, accessibility, and validation are proven.
11. Reuse demonstrations only where they materially improve a publication.
12. Consider Constitution or Handbook promotion only after repeated verification and editorial maturity.

## 30. Existing and future article decisions

**Directness Without False Certainty** remains unchanged during v1 architecture and initial implementation. Editorial Components must not be delayed to retrofit it. A future canonical Direct demonstration may be added only when it materially improves the article and its engine behavior remains verified.

**Line Breaks Are Part of the Meaning** is the first intended publication integration for DEMO-001. It is not drafted or published until architecture approval, shared component implementation, registry validation, real capture, demonstration verification, accessibility QA, fallback drift validation, and analytics validation pass.

## 31. Browser-chat and Codex boundary

Browser chat owns strategy, trust definitions, editorial claim boundaries, publication destination, demonstration selection, roadmap priority, whether a component materially improves a publication, editorial debt decisions, Canon or Handbook promotion, and final publication readiness.

Codex owns repository audit, minimal file and schema implementation, validators, approved adapters, rendering and state mechanics, accessibility and reduced motion, fixed analytics attributes, failure handling, regression protection, browser/mobile QA, and maintenance documentation.

Codex must not simulate capability, duplicate engine logic, invent article claims, expand engine behavior for spectacle, promote evidence into Canon or Handbook, automatically retrofit old articles, blur demonstration classifications, or send content to analytics.

## 32. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Parallel engine logic | Approved adapters, no transformations in components, and the duplicated-logic review checklist |
| Recorded Replay drift | Commit, fixture, regression, dependency declarations, verification date, and `recheck-required` |
| Visual over-promise | Visible classifications, limitations, static explanation, and no simulated controls |
| Component-system overgrowth | Replay and Compare first, one demonstration, no framework/build step, and deferred Experiment |
| Accessibility regressions | Semantic fallback, keyboard support, focus, reduced motion, text alternatives, and browser QA |
| Analytics privacy leakage | Fixed events, Demo ID only, validator checks, and no content-bearing errors |
| JavaScript dependency | Complete static fallback and interaction-independent comprehension |
| Demonstration proliferation | Stable IDs, canonical registry, reuse, editorial debt limits, and retirement |
| Engine changes invalidate publications | Declared dependencies, targeted re-verification, honest historical labels, and no silent substitution |

## 33. Explicit non-goals

This architecture cycle does not implement Replay, Compare, Inspect, Experiment, adapters, CSS, JavaScript, a registry, a validator, public HTML, an article, an evidence packet, Canon material, Handbook material, a build system, or any engine change.

## 34. Exact next implementation cycle

After review, commit, and push this architecture separately, run one bounded Editorial Components v1 implementation cycle that creates:

- Demonstration Library schema validation;
- the shared Replay and Compare progressive-enhancement shell;
- canonical DEMO-001 captured from the committed engine;
- static-fallback drift validation;
- accessibility and reduced-motion behavior;
- fixed component analytics events;
- responsive theme-compatible presentation; and
- regression and browser QA.

Do not draft or publish **Line Breaks Are Part of the Meaning** until implementation and DEMO-001 verification pass.

## 35. V1 foundation implementation record

**Implementation date:** July 29, 2026
**Baseline:** `4fb9925` — `docs: define Editorial Components v1 architecture`
**Engine provenance:** `6774224` — `fix: make Professional tone grammar-safe`, compared with `2d9454d` — `fix: preserve Second Draft text structure`

The first foundation implements:

- `data/editorial-demonstrations.json`
- `scripts/validate-demonstrations.mjs`
- `js/editorial-components.js`
- `css/editorial-components.css`
- `tests/fixtures/editorial-components-demo-001.html`

The library remains schema version 1 and contains exactly one verified `recorded-replay`: DEMO-001. Its modes are `compare` and `replay`; it has six fixed privacy-safe analytics events and no publication destination. A verified canonical demonstration may exist before publication. Destination-specific drift checks become mandatory when a real destination is declared, while the permanent noindex QA fixture verifies component and fallback mechanics without becoming a publication destination.

The initial two-state replay was rejected because its source and current output were intentionally identical. That capture was truthful but visually inert and made Replay appear unresponsive.

DEMO-001 now compares two real production versions. Both historical and current sources were loaded with `git show <commit>:js/second-draft.js` and executed twice through the same VM approach used by `tests/regression.js`. The exact call used `{ "tone": "natural", "length": "same", "reflow": false }`. Commit `6774224` deterministically flattened the five source lines into `Calendar feeds or event links Desired go-live timeline Happy to schedule a quick call if that would be easier. Thanks, Guy`. Commit `2d9454d` deterministically preserved the exact five-line source. No output was authored, inferred, or reconstructed for the demonstration.

The registry uses one bounded `comparison` object with exactly two versions: `previous` and `current`. Replay contains three complete captured states: Original source, Previous engine behavior, and Current verified behavior. Step provenance must match the corresponding version output and commit. The supporting regression remains `SecondDraft structure preservation`; the durable rule reference remains `SD-STRUCTURE-001`. No step claims an engine-emitted intermediate finding or rule match.

The validator is dependency-free, read-only Node ESM. It validates schema, identity, classification, status, modes, both engine commits, exact version labels and outputs, local historical module availability, step-to-version provenance, fixture topology, rules, regressions, dates, verification methods and dependencies, limitations, accessibility declarations, fixed analytics, empty pre-publication destinations, and declared-destination fallback drift. Drift validation covers source, previous output, and current output with exact LF-preserving comparison.

The runtime progressively enhances and reuses the three complete fallback panels rather than appending another output panel. Successful enhancement shows only the evidence needed for the current Compare or Replay state; hidden fallback panels use native `hidden` and `aria-hidden`, preventing redundant visual and screen-reader evidence. Failure and no-JavaScript states retain all three readable panels. The runtime caches registry requests, supports multiple roots, and contains no engine execution or transformation logic.

Compare defaults to Previous engine behavior versus Current verified behavior. Replay supports Play comparison, Pause, Restart, Previous, Next, Show source, Show current output, progress, polite status, and metadata disclosure. Play visibly traverses all three states and stops at current behavior. Native disabled states prevent Previous on the first step, Next on the last step, and Pause while idle. The QA fixture exposes all controls; a future article may use a quieter hierarchy without changing evidence. The explicit Show current output control carries the completion event because no supported programmatic StatsKit event API exists locally; starting Play is not counted as completion.

Browser QA passed at desktop, 375 × 812, and 320 × 812. Light, Dark, and Terminal remained legible; keyboard controls, semantic metadata, polite status, reduced motion, minimum touch targets, wrapping, and no horizontal overflow passed. No-JavaScript, missing-registry, and missing-record states retained complete evidence without fabricated output. The page loaded no Second Draft controller and produced no console errors or failed requests.

The updated claim remains narrow: both outputs came from named real commits; the comparison demonstrates one repaired fixture; it accepts no reader input; and it does not establish universal structure understanding, Markdown parsing, or semantic meaning for every newline. Live Engine, Inspect, Experiment, adapters, DEMO-002, public article integration, Journal metadata, and sitemap work remain deferred.

**Exact next cycle:** Review, commit, and push this foundation, then production-smoke the deployed internal QA fixture. After a clean checkpoint, run a separate Engine Room publication cycle for **Line Breaks Are Part of the Meaning**, add its real destination, and activate article fallback drift validation. Do not begin DEMO-002 before that integration is published and production-smoked.
