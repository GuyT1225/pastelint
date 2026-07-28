# Workflow v2

## Purpose

Workflow v2 connects verified product work with reusable knowledge without making publication a condition of shipping.

Technical lane:

> Trigger → Scope → Audit → Implement → Regression tests → Manual QA → Technical documentation and rule metadata → Technical checkpoint → Ship verified behavior

Knowledge lane:

> Completed significant cycle → Ask “Did we create reusable knowledge?” → Capture or close → Assign one primary destination → Brief or publish only when warranted → Add provenance and analytics → Publication checkpoint → Post-publication review → Update, promote, supersede, or retire

Verified engine work ships when it is ready. Editorial publication may follow later or not at all.

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
- **Editorial Canon (`editorial-canon`):** a mature, durable, source-backed principle that should govern future editorial decisions.
- **Second Draft Handbook (`second-draft-handbook`):** stable, teachable material supported by examples, exercises, diagrams, checklists, or repeatable tests.
- **Internal documentation (`internal-documentation`):** implementation-specific, mechanical, immature, or maintainer-only knowledge.

An item may later be promoted, but promotion candidates do not replace its current primary destination.

## Invalidation scan

Every significant cycle asks whether it made any of these inaccurate, incomplete, or qualified:

- Engine Room claims
- Editor’s Desk principles
- Sources & Case Studies interpretations
- Architecture or rulebook statements
- Editorial Canon principles
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
