# Interactive Editorial Demonstration Style Guide

Status: Internal production guidance

Scope: PasteLint Journal interactive editorial demonstrations

Authority: The Editorial Constitution, Editorial Canon, demonstration registry, and verified production examples

## Purpose

Interactive editorial demonstrations help a reader inspect an editorial decision, its evidence, and its limits. They answer **why a change was made—or deliberately not made**. They are not miniature product experiences, decorative interactives, or substitutes for the article's argument.

The article remains authoritative. A demonstration may reveal, compare, or annotate evidence, but it must remain understandable without interaction and must not make a stronger claim than the surrounding article supports.

## Admission test

Use a demonstration only when it materially improves one of these tasks:

- comparing verified states that are difficult to inspect in prose;
- seeing what changed, what was preserved, and why;
- understanding an editorial decision that depends on protected meaning;
- distinguishing preparation from an unobserved downstream outcome.

Do not use a demonstration when:

- the same point is already clear in a sentence, quotation, table, or static example;
- interaction would merely repeat the article;
- the evidence cannot be reproduced, attributed, or bounded;
- a synthetic example might be mistaken for PasteLint output;
- the proposed interaction requires a new demonstration type;
- novelty, engagement, or visual variety is the primary justification.

Before authoring, complete this sentence: **The reader needs to interact because…** If the answer does not identify a clearer editorial understanding, use static prose instead.

## Approved patterns

| Pattern | Evidence classification | Primary use | Production record |
|---|---|---|---|
| Before / After / Why | Recorded Replay | Compare verified engine behavior and explain the repair | DEMO-001 |
| Editorial Decision + Protected Meaning | Concept Illustration | Expose a bounded editorial choice and the language it protects | DEMO-003 |
| Destination Readiness | Concept Illustration | Explain a handoff boundary without implying downstream completion | DEMO-004 |

These are the only approved patterns. The registry validator recognizes a future `live-engine` classification, but no live-engine demonstration is currently approved or published. DEMO-002 remains reserved and must not be reassigned.

### 1. Before / After / Why

Use this pattern for a stable, reproducible implementation record. Its conceptual name is “Before / After / Why”; production labels should describe the evidence precisely, such as “Previous engine behavior” and “Current verified behavior.”

Required structure:

1. A persistent explanation before the interactive figure stating what the reader is about to inspect.
2. A visible Recorded Replay classification with accurate engine and commit provenance.
3. The original source, previous output, and current verified output in the static HTML fallback.
4. A concise caption or takeaway naming the observed difference.
5. Reasoning that distinguishes **Preserved**, **Changed**, and **Intentionally unchanged**.
6. A limitation that bounds the example and prevents generalization beyond the fixture.
7. A complete text alternative and no-JavaScript fallback.

On larger screens, comparison is the default reading state. Replay may reveal the same recorded evidence step by step. Replay must never imply that the engine is executing live.

### 2. Editorial Decision + Protected Meaning

Use this pattern when the editorial lesson is a choice, not a product execution. It is a Concept Illustration.

Required structure:

1. A visible classification: **Concept Illustration · Does not execute PasteLint**.
2. The original sentence.
3. A possible revision.
4. The editorial decision.
5. Visible marking of protected language, such as modality, uncertainty, negation, attribution, names, or numbers.
6. Reasoning that names what was preserved, changed, and intentionally unchanged.
7. A complete text alternative and a claim-bounding limitation.

Protected text should be marked semantically with `<mark>` and explained in nearby prose. Color alone must not carry its meaning.

### 3. Destination Readiness

Use this pattern to explain that preparation and downstream acceptance are different states. It is a Concept Illustration.

Required structure:

1. A visible classification: **Concept Illustration · Does not execute PasteLint**.
2. A short semantic progression: **Draft → Reviewed → Prepared → Ready for destination**.
3. An immediately adjacent boundary statement naming what has not been observed.
4. Optional disclosed reasoning that explains why the boundary matters.
5. A complete text alternative and limitation.

The progression is explanatory, not a simulated progress indicator. It must not imply publication, deployment, delivery, execution, or acceptance unless the cited evidence directly observes that outcome.

## Editorial claim boundaries

- Demonstrations expose verified editorial behavior; they do not establish universal product behavior.
- A Recorded Replay reports what the named fixture and commits produced. It does not claim current live execution or broad performance.
- A Concept Illustration teaches a principle. It must never be presented as engine output.
- “Prepared,” “generated,” and “copied” do not mean “published,” “deployed,” “delivered,” or “accepted.”
- Preservation is evidence. Intentionally unchanged text should be reported as an editorial outcome, not omitted as inactivity.
- The headline, visible evidence, reasoning, text alternative, and limitation must agree.
- Uncertainty, attribution, modality, and scope may not be strengthened for dramatic effect.
- Interaction events show that a control was used. They do not prove comprehension, agreement, or successful downstream action.

## Evidence and verification

Every registry record must use a stable `DEMO-###` identifier, a unique kebab-case slug, an allowed lifecycle status, one approved pattern, declared dependencies, and explicit publication destinations.

For a Recorded Replay:

- identify the engine module, options, fixture, and regression case;
- store the source and both compared outputs;
- identify resolvable previous and current commits;
- ensure the current recorded output exactly matches the verified fixture output;
- record the rules and steps used to explain the difference;
- include capture and verification dates;
- complete regression, browser, static-fallback, accessibility, and privacy review.

For a Concept Illustration:

- keep engine, comparison, fixture, rules, steps, and regressions empty;
- use only the fields required by the approved pattern;
- complete browser, static-fallback, accessibility, and privacy review;
- state plainly that PasteLint is not being executed.

Only a verified record should receive full production enhancement. Draft, recheck-required, or retired records must not silently appear current.

## Static and interactive responsibilities

The static document must contain the classification, title, essential evidence, conclusion, text alternative, and limitation. A reader must be able to understand the editorial claim before JavaScript runs and if JavaScript fails.

Interaction may change presentation, not truth. It may:

- replay already recorded states;
- switch between previous and current evidence;
- reveal the source;
- change between side-by-side and stacked comparison;
- disclose supporting reasoning or metadata.

Interaction must not generate new editorial output, conceal the only copy of essential evidence, replace the article's conclusion, or move focus merely because the displayed state changed.

## Responsive behavior

### Mobile: 480 px and below

DEMO-001 uses progressive disclosure instead of the desktop replay controls. The source, previous output, and current output become adjacent native disclosures; previous and current begin open, while source begins closed. More than one disclosure may remain open so comparison does not require tab-like switching.

Mobile requirements:

- keep each control attached to the evidence it reveals;
- preserve a minimum 44 px control target;
- do not scroll or move focus after disclosure;
- avoid viewport jumps and replacement of large content blocks;
- retain the full readable fallback without JavaScript;
- use a single-column Destination Readiness progression;
- prevent horizontal overflow at 320, 375, 390, 430, and 480 px.

The current runtime chooses its mobile or larger-screen model once during initial enhancement. A page loaded above 480 px and then resized below the breakpoint retains the larger-screen control cluster, with CSS providing wrapping resilience. Publication QA must therefore test fresh loads at mobile widths, not infer phone behavior only by resizing a desktop session.

### Tablet and desktop: above 480 px

DEMO-001 uses the compare/replay model. Previous and current evidence are the default comparison; source is supporting evidence. Controls should remain subordinate to the article and close to the changing content.

Control hierarchy:

1. Primary: start or pause the recorded replay.
2. Secondary: previous, next, and start over.
3. Tertiary: source/result visibility and comparison layout.

Native disabled states should prevent meaningless navigation. The control area may wrap, but it must not resemble an application toolbar or separate the reader from the evidence.

Concept Illustrations should continue to rely on semantic content and restrained native disclosure rather than acquire replay controls.

## Progressive disclosure and replay

Use progressive disclosure when it keeps explanation beside evidence and supports reading better than a persistent control cluster. A disclosure may contain supplementary reasoning or a source view; it must not contain the only statement of the result, limitation, or editorial boundary.

Use replay only for ordered, previously verified evidence. A replay must:

- identify itself as recorded evidence;
- use the fixed two-second step interval unless the shared component contract changes;
- expose pause, previous, next, start-over, and comparison controls through the shared runtime;
- communicate progress through the shared status region;
- finish on the recorded current result;
- remain fully understandable without replay.

Do not add carousel behavior, automatic scrolling, modal presentation, decorative animation, or page-specific control logic.

## Accessibility requirements

- Use semantic HTML before enhancement: figures, headings, ordered lists, definition structures where appropriate, and native `<details>`/`<summary>` disclosures.
- Give each demonstration a unique accessible label relationship.
- Use native buttons for actions and native disabled states when an action is unavailable.
- Keep keyboard order aligned with reading order and maintain a visible focus indicator in every theme.
- Announce meaningful replay or display-state changes through the shared polite status region.
- Pair visual hiding with appropriate accessibility state; do not leave inactive comparison panels exposed to assistive technology.
- Provide text alternatives for visual comparisons and protected-language marking.
- Do not rely on color, position, or animation alone.
- Respect reduced-motion preferences.
- Do not move focus or scroll the viewport after ordinary demo interaction.
- Preserve useful content and reasoning when JavaScript is unavailable.

Accessibility is part of the authoring record and verification decision, not a post-publication correction.

## Theme compatibility

Demonstrations must inherit shared Journal tokens and work in Light, Dark, and Terminal themes. New demonstrations must not add hard-coded page colors or page-specific theme fixes.

Verify in every theme:

- text, borders, protected marks, and evidence boundaries remain legible;
- hover, focus, active, and disabled controls remain distinguishable;
- syntax-like or monospaced evidence remains quieter than the article heading hierarchy;
- the component continues to read as editorial evidence, not a dashboard card.

## Copy conventions

- Prefer observable nouns and verbs: **source**, **previous**, **current**, **preserved**, **changed**, **prepared**, **verified**.
- Label evidence precisely; do not substitute generic “before” and “after” when version or engine provenance matters.
- Keep control labels literal: **Step through repair**, **Pause**, **Previous**, **Next**, **Start over**, **Show source**, **Show repaired result**, **Compare side-by-side**, and **Stack comparison**.
- Write limitations as direct boundaries, not disclaimers hidden in metadata.
- Use calm, editorial explanation. Avoid congratulatory copy, scores, success theatrics, marketing language, and claims of reader comprehension.
- Keep status messages factual and proportionate to the state displayed.

## Analytics guidance

Analytics are optional. An empty event list is correct when interaction data has no defined editorial use, as in the current Concept Illustrations.

When analytics are justified:

- use only declared fixed events in the form `Editorial Demo | DEMO-### | action`;
- use the shared allowed actions: `replay-start`, `replay-complete`, `replay-step`, `compare-toggle`, `metadata-open`, and `reset`;
- never include article text, fixture text, user text, URLs, email addresses, phone numbers, SSML, or other content-derived values;
- do not interpret an event as proof of understanding or editorial success;
- preserve the existing privacy-first loader and event conventions.

Do not invent per-article event names or add analytics solely because a control exists.

## Journal and knowledge relationships

- Engine Room is the natural home for a Recorded Replay because it documents verified implementation behavior.
- Editor's Desk may use a Concept Illustration when it clarifies an enduring editorial principle without posing as implementation evidence.
- Sources & Case Studies may use a Concept Illustration only when it helps inspect attributed evidence and does not blur evidence with product behavior.
- A demonstration supports the host article's existing Canon and knowledge-ledger relationships. It does not create a Canon principle or knowledge item by itself.
- Add a destination to the registry only after the article placement is intentional and its fallback is complete.
- Do not densify related reading merely to advertise a demonstration.

## Publication QA checklist

### Editorial fit

- [ ] The interaction adds understanding that static prose alone does not provide.
- [ ] The pattern is one of the three approved patterns.
- [ ] The department and article context match the evidence classification.
- [ ] The demonstration supports an existing, justified knowledge relationship.
- [ ] Every claim is observable, attributed where necessary, and bounded.
- [ ] Preserved and intentionally unchanged meaning are identified where relevant.
- [ ] The limitation is visible and agrees with the headline and evidence.

### Registry and evidence

- [ ] The ID, slug, lifecycle status, pattern, dependencies, and destinations are valid and unique.
- [ ] Recorded evidence matches its fixture, regression, rules, steps, and commits.
- [ ] Concept Illustration fields do not imply engine execution.
- [ ] Capture and verification metadata are current for the dependencies being published.
- [ ] Analytics are either intentionally empty or limited to approved fixed events.

### Reading and accessibility

- [ ] The complete claim remains readable before enhancement and without JavaScript.
- [ ] Keyboard order, disabled states, focus visibility, status announcements, and disclosures work as expected.
- [ ] No interaction moves focus or scrolls the viewport unnecessarily.
- [ ] Text alternatives communicate visual evidence and protected meaning.
- [ ] Reduced-motion behavior is respected.

### Responsive and theme review

- [ ] Fresh-load mobile behavior is checked at 320, 375, 390, 430, and 480 px.
- [ ] The larger-screen model is checked above 480 px, including tablet and desktop widths.
- [ ] A desktop-to-mobile resize is checked as resilience QA, separately from fresh-load mobile QA.
- [ ] Light, Dark, and Terminal themes preserve contrast, hierarchy, focus, and disabled states.
- [ ] There is no overlap, unexpected wrapping, or horizontal overflow.

### Automated validation

Run the repository's existing checks:

```powershell
node scripts/validate-demonstrations.mjs
node scripts/validate-journal.mjs
node tests/regression.js
node tests/journal-continuity.test.js
node tests/analytics-loader.test.js
git diff --check
```

Also inspect the final diff and confirm that no article claim, registry relationship, dependency, or interaction changed outside the intended publication scope.

## Source implementations

This guide records the behavior and conventions in:

- `data/editorial-demonstrations.json`
- `js/editorial-components.js`
- `css/editorial-components.css`
- `journal-engine-room-line-breaks-are-part-of-the-meaning.html` (DEMO-001)
- `journal-engine-room-directness-without-false-certainty.html` (DEMO-003)
- `journal-engine-room-prepared-handoff-is-not-accepted-outcome.html` (DEMO-004)
- `scripts/validate-demonstrations.mjs`
- `tests/regression.js`
- `docs/editorial-components-v1.md`
- `docs/editorial-constitution.md`
- `docs/editorial-canon.md`
- `docs/journal-analytics-events.md`
- `data/knowledge-ledger.json`

When this guide and production behavior diverge, verify the behavior first, then update the guide and its governing documentation together. Do not silently make a new pattern by exception.
