# Workflow v2

## Purpose

Workflow v2 connects verified product work with reusable knowledge without making publication a condition of shipping.

The [Editorial Constitution](editorial-constitution.md) governs enduring editorial principles. This document translates those principles into lifecycle, evidence, and knowledge-flow rules.

Implementation handoffs within this workflow follow the [Codex Dispatch Standard](codex-dispatch-standard.md). That standard governs project rehydration, repository auditing, scope, validation evidence, and return briefs; this document continues to govern lifecycle and knowledge flow.

Technical lane:

> Trigger → Scope → Audit → Implement → Regression tests → Manual QA → Technical documentation and rule metadata → Technical checkpoint → Ship verified behavior

Knowledge lane:

> Completed significant cycle → Ask “Did we create reusable knowledge?” → Capture or close → Assign one primary destination → Brief or publish only when warranted → Add provenance and analytics → Publication checkpoint → Post-publication review → Update, promote, supersede, or retire

Verified engine work ships when it is ready. Editorial publication may follow later or not at all.

## Editorial Components evidence layer

Workflow v2 remains a two-lane system. Editorial Components add a cross-cutting evidence layer between verified technical proof and optional publication:

> Verified behavior → canonical demonstration → verification state → reusable editorial asset

Engine work still ships independently when it is ready. A demonstration is created only from verified behavior and does not become a prerequisite for technical shipment. Not every engine cycle requires a demonstration, not every demonstration requires an article, and not every article requires a demonstration.

A publication consumes verified behavior through a canonical demonstration when interaction or structured comparison materially improves the explanation. Demonstration capture and publication integration may remain separate commits. The same canonical demonstration may support multiple publication surfaces and may later support an independent Editorial Constitution or Second Draft Handbook promotion decision.

Editorial Components do not create a third publication lane or a new Journal track. They are cross-cutting evidence infrastructure governed by the trust, verification, accessibility, static-fallback, and privacy contract in `docs/editorial-components-v1.md`.

## Cycle scope fields

Every significant cycle begins with:

- **Problem:** the observed failure or need.
- **Invariant:** what must remain true.
- **Boundaries:** behavior and files outside the cycle.
- **Proof:** automated and manual evidence required.
- **Impact surfaces:** product, tests, documentation, metadata, articles, and prior claims that may change.

## Significant-cycle criteria

Make one knowledge-capture decision when a cycle introduces new user-visible behavior, a preservation invariant, a failure class, a reusable regression fixture, a durable editorial distinction, an external-evidence pattern, or a reusable diagram, checklist, or framework.

Routine formatting, comments, naming cleanup, tiny internal maintenance, and changes with no durable behavioral or editorial consequence do not require capture.

## Primary destination decision

Ask: **Where should a reader encounter this knowledge first?**

Each item has exactly one current primary destination:

- **Engine Room (`engine-room`):** “What changed in PasteLint, how is it tested, and what remains bounded?”
- **Editor’s Desk (`editors-desk`):** a practical editorial principle readers can apply beyond PasteLint.
- **Sources & Case Studies (`sources-case-studies`):** external evidence, practitioner experience, research, or an observed case is load-bearing.
- **Editorial Constitution (`editorial-canon`):** a mature, durable, source-backed principle approved for constitutional authority. The stable destination ID remains `editorial-canon`.
- **Second Draft Handbook (`second-draft-handbook`):** stable, teachable material supported by examples, exercises, diagrams, checklists, or repeatable tests.
- **Internal documentation (`internal-documentation`):** implementation-specific, mechanical, immature, or maintainer-only knowledge.

An item may later be promoted, but promotion candidates do not replace its current primary destination.

## Invalidation scan

Every significant cycle asks whether it made any of these inaccurate, incomplete, or qualified:

- Engine Room claims
- Editor’s Desk principles
- Sources & Case Studies interpretations
- Architecture or rulebook statements
- Editorial Constitution principles
- Handbook examples
- Regression fixtures
- Published article examples

Record affected knowledge in the ledger even when no immediate update is required.

## Git checkpoints

- **Technical checkpoint:** engine logic, regression tests, rule metadata, architecture, editorial rulebook, and engine changelog.
- **Publication checkpoint:** article, department styling, Journal card, metadata, structured data, sitemap, related reading, and analytics events.
- **Cross-cutting infrastructure checkpoint:** manifest, validator, analytics backfill, templates, and shared workflow infrastructure.

## Editorial debt limit

Keep at most one article drafting, one article briefed, and one captured next. Everything else remains in the knowledge ledger without becoming an immediate publication obligation. Companion articles are optional.

## Editorial Knowledge Graph v1

The Journal uses a curated static relationship layer so a reader can follow the reasoning between published investigations without introducing automated recommendations.

`data/journal-manifest.json` remains the article-identity authority. Its top-level `principles` and `sourceMaterials` arrays define stable non-article nodes. A participating article may declare one `knowledgeGraph` object with exactly three relationship types:

- `continueTheRecord`: a typed edge to another manifest article, with a short editorial explanation of why the reader should continue;
- `relatedPrinciples`: references to stable principle IDs; and
- `sourceMaterial`: references to reviewed source or governance records.

All relationships are selected by an editor. Shared keywords, department, recency, traffic goals, or empty-space pressure do not justify an edge. A relationship must show that one article supplies evidence, principle, consequence, context, or another necessary angle for the other. Reciprocal edges are optional and require their own explanation.

The reader-facing label for article edges is **Continue the Record**. It replaces recommendation language for graph-backed continuations. Related Principles may remain unlinked until a dedicated destination exists. Source Material links only to records actually reviewed or captured.

The Journal validator rejects unknown nodes, unsupported relationship types, duplicate edges, self-links, missing descriptions, missing analytics declarations for article edges, and missing static relationship markup. This structure is sufficient for a future visual graph to render article, principle, and source nodes with typed edges; that future view must consume this curated data rather than create a second knowledge model.

## Analytics windows

- Run an immediate post-publication smoke test.
- Review directionally after 14 days.
- Review more broadly after 28 days.

Low-volume analytics are not editorial approval gates. Event totals are not automatically unique-user conversion rates. Each article should have one primary analytics question.

## Journal publication identity

Journal publication identity, historical-date evidence, structured authorship, and article sharing follow the narrow contract in `docs/journal-publication-identity.md`.

## Three-department design governance

- **Engine Room:** technical, operational, evidence-led.
- **Editor’s Desk:** literary, practical, interpretive.
- **Sources & Case Studies:** documentary, source-led, archival.

All departments share the site shell, grid, navigation, theme system, accessibility, metadata, analytics, and core spacing rhythm. Older articles are not retrofitted solely for visual consistency. The next Sources & Case Studies publication will establish that department’s mature template.
