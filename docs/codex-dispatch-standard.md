# Codex Dispatch Standard

This document is the authoritative repository standard for handing PasteLint implementation work to Codex. It defines the safeguards a dispatch must establish and the evidence its return must provide.

## 1. Purpose and authority

A Codex Dispatch is a controlled engineering handoff. It states the objective, context, governing authority, constraints, scope, preservation requirements, deliverables, validation, success criteria, and return requirements for a bounded milestone.

Use a dispatch for implementation, repository maintenance, publication work, validation, deployment, or any task where repository state and project constraints affect safe completion. A short read-only question does not require a full dispatch, but it remains subject to repository truth and honest reporting.

The current repository and its canonical documentation are authoritative. Domain contracts, architecture documents, data schemas, validators, and established repository conventions outrank a dispatch when they conflict. A dispatch may narrow a task or explicitly authorize an exceptional operation; it must not silently repeal a canonical project constraint. Codex must stop and report a conflict that cannot be resolved from repository evidence.

## 2. Mandatory project rehydration

Every implementation dispatch begins with Phase 0: Project Rehydration unless the dispatch contains an explicit, narrow waiver. Convenience, familiarity, or a recent session is not a waiver.

Before editing, Codex must:

1. Verify the repository path and Git worktree root.
2. Report the active branch and current commit.
3. Inspect staged, unstaged, and untracked changes.
4. Check local and remote branch relationships when pushing, merging, deploying, or relying on remote state.
5. Identify and preserve unrelated work.
6. Discover and read the current documents governing the task.
7. Inspect the relevant implementation, tests, validators, data, and conventions.
8. Summarize the existing architecture, constraints, and expected impact before editing.

Codex must stop when the repository is not the requested repository, the working state is unsafe or unexpectedly dirty, required authority is missing, or proceeding would overwrite or entangle unrelated work. If a dispatch permits work in a dirty tree, that exception must identify the acceptable changes and preservation boundary.

## 3. Documentation discovery

A dispatch should name known task-specific documents, but filenames in a prompt are leads rather than a permanent authority list. During rehydration, Codex must inspect the repository's current documentation entry points and search by task domain.

Relevant domains may include:

- architecture and stage boundaries;
- product identity and positioning;
- editorial policy and publication identity;
- workflow and knowledge capture;
- accessibility and responsive behavior;
- analytics and privacy;
- validation and QA;
- deployment and publishing;
- schemas, manifests, and data contracts; and
- the specific tool, engine, component, or content surface being changed.

Examples include `README.md`, `QA_CHECKLIST.md`, and documents under `docs/`. These examples do not replace discovery. When two documents appear to conflict, prefer the narrower canonical domain contract and current implementation evidence, then report unresolved ambiguity.

## 4. Repository audit

Before implementation, inspect the existing code, markup, styles, data, tests, validators, and nearby conventions that define the requested surface.

Codex must:

- extend existing architecture where it remains suitable;
- avoid parallel systems and duplicated sources of truth;
- separate verified repository facts from assumptions and unknowns;
- explain decisions that materially affect architecture, contracts, or maintenance;
- choose the simplest maintainable approach consistent with project constraints; and
- validate assumptions against the implementation before relying on them.

New architecture requires evidence that the existing structure cannot support the milestone cleanly. A dispatch is not permission to redesign adjacent systems.

## 5. Canonical dispatch structure

A full dispatch should contain:

1. Title and milestone
2. Repository
3. Objective
4. Mandatory Project Rehydration
5. Context
6. Governing principles and task-specific authority
7. Scope
8. Deliverables
9. Constraints
10. Preserve
11. Out of scope
12. Validation
13. Success criteria
14. Commit or deployment policy, when applicable
15. Return Brief

Small tasks may combine sections, but they must preserve repository verification, authority discovery, scope and preservation boundaries, validation, mutation policy, and an evidence-based return.

## 6. Scope discipline

Codex implements only the requested milestone. It must not perform opportunistic cleanup, unrelated refactoring, silent scope expansion, or speculative modernization. Existing user changes must be preserved.

Classify discoveries as follows:

- **In-scope correction:** necessary to satisfy the stated objective or its explicit success criteria.
- **Blocking defect:** prevents safe or truthful completion and requires resolution or a broader decision before work can continue.
- **Unrelated improvement:** useful but independent of the milestone; report it without implementation.
- **Future opportunity:** a non-urgent idea that may deserve a separate dispatch after evidence and prioritization.

If safe completion requires a product, architecture, editorial, privacy, or deployment decision outside the dispatch, stop and request that decision. Do not convert a blocker into implied permission.

## 7. Preservation requirements

Every dispatch must state what must not change. Preservation requirements are acceptance criteria, not background preferences, because a locally successful edit can still regress the system around it.

Depending on the task, preserve:

- public behavior and user work;
- editorial voice and product positioning;
- deterministic safeguards and data contracts;
- accessibility, focus, responsive behavior, and theme behavior;
- privacy and analytics boundaries;
- metadata authority and publication provenance;
- deployment model and static-site compatibility; and
- unrelated repository changes.

When preservation cannot be proven completely, report the bounded evidence and remaining uncertainty.

## 8. Validation standard

Validation must be exact, proportional to risk, and reported literally. Codex must list:

- commands actually run and their results;
- warnings and whether they are new, pre-existing, or unresolved;
- checks that could not be completed and why;
- browser or visual QA actually performed, including relevant viewports and themes;
- applicable data, schema, link, or validator checks; and
- production verification when publication or deployment is in scope.

Never claim that a test, browser check, push, deployment, or production state succeeded unless it was observed successfully. If an initial command fails and a corrected command succeeds, disclose the failed attempt when it affects confidence, reproducibility, or interpretation. Distinguish local validation, remote acceptance, deployment completion, and production verification.

For documentation-only work, inspect Markdown structure and rendered readability, verify internal links and referenced paths, search for conflicting guidance, run applicable repository documentation checks, and run `git diff --check`. If no documentation validator exists, say so and report the manual review performed.

## 9. Commit, push, and deployment policy

Safe defaults are:

- do not commit unless instructed;
- do not push unless instructed;
- never force-push without explicit exceptional authorization;
- stage only intended files;
- use one focused commit message for one coherent milestone;
- inspect the committed diff and final working-tree state; and
- treat push, deployment, and production verification as separate outcomes.

A dispatch may explicitly override the commit or deployment default. Authorization to commit does not authorize a push. Authorization to push does not establish that deployment or production validation succeeded.

## 10. Canonical return brief

Every implementation return includes the applicable sections below.

### Phase 0 Summary

- repository, branch, current commit, and initial working state;
- governing documentation reviewed;
- implementation and constraints discovered; and
- relevant local and remote relationship.

### Architecture or Implementation Decision

- approach chosen and why;
- meaningful alternatives considered; and
- assumptions or bounded uncertainty.

### Files Changed

- every modified file and its purpose; and
- any unexpected changes.

### Validation

- exact commands and results;
- warnings and incomplete checks; and
- browser, deployment, or production evidence where applicable.

### Commit or Deployment

When applicable, include the commit hash and message, branch and push result, deployment status, production status, and final working-tree state.

### Repository Improvements Discovered

This section is mandatory. Record unrelated opportunities involving architecture, maintainability, validation, documentation, workflow, publishing, or project organization without implementing them. State `None discovered` when appropriate.

### Lessons Learned

This section is mandatory. Summarize what the repository revealed about architecture, engineering judgment, workflow, maintainability, or project organization. Avoid a list of low-level edits.

### Final Recommendation

End with exactly one terminal state permitted by the dispatch. Use a state appropriate to the milestone, such as:

- `READY TO MERGE`
- `READY TO PUSH`
- `READY WITH MINOR OBSERVATIONS`
- `HOLD`
- `MILESTONE COMPLETE`

The dispatch should list its permitted choices. If it does not, choose a literal state that distinguishes completion from remaining action.

## 11. Trust and evidence

PasteLint dispatches follow the same evidence-oriented principle as the product and Journal:

- evidence before assumption;
- repository state before memory;
- validation before confidence;
- explicit uncertainty rather than invented precision;
- honest limitations rather than implied coverage; and
- observable production evidence before claims of production success.

A return brief is a factual record. It reports what happened; it does not reward activity or conceal incomplete proof.

## 12. Reusable dispatch template

```markdown
# CODEX DISPATCH

## <Milestone title>

Repository: `<absolute path>`

### Objective

<One bounded outcome.>

### Mandatory Project Rehydration

Verify repository identity, branch, commit, staged/unstaged/untracked state, relevant remote state, and governing documents. Audit the current implementation and summarize constraints before editing. Stop on unsafe or unexpected state.

### Context and authority

<Why this work is needed and any known task-specific documents. Repository discovery remains required.>

### Scope and deliverables

- <Required change or artifact>

### Constraints and preserve

- <What must remain true>

### Out of scope

- <What must not be changed>

### Validation

- `<exact command or manual check>`
- <Relevant browser, viewport, theme, link, data, or production checks>

### Success criteria

- <Observable completion condition>

### Commit policy

<No commit / focused commit message / push and deployment authority.>

### Return Brief

Report Phase 0 Summary, Architecture or Implementation Decision, Files Changed, Validation, Commit or Deployment, Repository Improvements Discovered, Lessons Learned, and exactly one of: `<permitted terminal states>`.
```

## 13. Scaling examples

### Small interface refinement

```markdown
# CODEX DISPATCH — Tighten Journal utility spacing

Repository: `C:\dev\pastelint\pastelint`

Objective: Reduce the utility-to-title gap using the existing spacing system.

Rehydrate the project, inspect the masthead markup and component CSS, and preserve typography, responsive behavior, themes, focus treatment, and footer placement. Change only the smallest relevant HTML or CSS surface. Validate at desktop, tablet, and mobile in Light, Dark, and Terminal; run applicable validators and `git diff --check`. Create one focused commit; do not push.

Return the canonical brief. Final state: `READY TO PUSH`, `READY WITH MINOR OBSERVATIONS`, or `HOLD`.
```

### Architectural or publishing milestone

```markdown
# CODEX DISPATCH — Establish publishing metadata contract

Repository: `C:\dev\pastelint\pastelint`

Objective: Define one canonical metadata source and validator contract for Journal publication.

Rehydrate the project; discover current publication, analytics, sitemap, manifest, and deployment authority; audit all existing metadata consumers before proposing architecture. Preserve published URLs, authorship, dates, privacy, static-site deployment, and unrelated content. Deliver the bounded schema, integration, validator coverage, and documentation named by the milestone. Report conflicts and future migrations without implementing them. Run exact schema, Journal, regression, link, responsive, deployment, and production checks required by the changed surfaces. Commit only if all local acceptance criteria pass; push or deploy only when separately authorized.

Return the canonical brief with production status distinguished from push status. Final state: `READY TO MERGE`, `READY WITH MINOR OBSERVATIONS`, or `HOLD`.
```

## Maintenance

Update this standard only through a dedicated governance milestone. Task-specific dispatches should link to or invoke it rather than reproduce its full rules. Domain documents remain responsible for their own architecture and policy; this document governs the handoff process that discovers and follows them.
