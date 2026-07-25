# Editorial Momentum Audit

## Current workflow map

### PasteLint Clean

- Primary action: Clean Text.
- Secondary actions: Revise in SecondDraft after a successful cleanup; View inspection report.
- Utility actions: Clear, Copy clean text.
- Next-step actions: Revise in SecondDraft is available after cleanup.
- Hierarchy problems: Copy clean text currently carries primary button styling even though it is a utility. The next editorial step exists, but it competes with utility actions in the same row.
- Momentum risk: After cleaning, users can copy or inspect, but the distinction between "use this result" and "continue revising" is not visually explicit enough.

### SecondDraft

- Primary action: Revise draft.
- Secondary actions: Build brief.
- Utility actions: Copy output, Clear.
- Next-step actions: SSML Builder is linked in navigation and footer, but the action area does not make speech preparation feel like the next stage.
- Hierarchy problems: Revise draft and Build brief are explained, but utilities sit in the same row without a shared action grammar.
- Momentum risk: Users can revise successfully, then may have to look around for the next step if they are preparing text for speech.

### SSML Builder

- Primary action: Clean + Generate SSML should be the recommended path for raw scripts.
- Secondary actions: Generate SSML from approved text; Generate from cleaned text.
- Utility actions: Clean text only, Auto Chunk, Export Chunks ZIP, Clear, Edit, Copy, Read, Stop Reading.
- Next-step actions: Chunking, copying, and exporting after SSML generation.
- Hierarchy problems: Generate SSML is visually primary in the raw input area, while Clean + Generate is styled as secondary. This can make the safer recommended path look less important.
- Momentum risk: SSML Builder supports multiple legitimate workflows, but the safest default path is not visually distinguished from specialist/utility paths.

## Interaction grammar proposal

### Primary stage action

The one main transformation for the current stage. It should be visually strongest and easiest to find.

Examples:
- Clean Text
- Revise Draft
- Clean + Generate SSML

### Secondary next-step action

The next editorial move after the current stage succeeds. It should be obvious, but quieter than the primary stage action.

Examples:
- Continue to SecondDraft
- Prepare for SSML
- Generate SSML from approved text

### Utility action

Support actions that should remain predictable but quieter.

Examples:
- Copy
- Download
- Clear
- Reset
- Clean text only
- Generate from approved text when preserving reviewed wording is the explicit goal

### Navigation action

Links between tools and pages. These should stay available in the header/footer and may appear as secondary next-step actions when they support the current workflow.

## Phase 1 implementation scope

This patch:

- Adds a small shared CSS action grammar for primary, secondary, utility, next-step, and stage-complete actions.
- Marks PasteLint Clean's Clean Text action as the Stage 1 primary action.
- Makes Copy clean text and inspection access quieter utilities after cleanup.
- Makes the SecondDraft continuation after cleanup read as a next-step action.
- Marks SecondDraft's Revise draft action as the Stage 2 primary action.
- Keeps Build brief as a secondary action and Copy/Clear as utilities.
- Adds a quiet Prepare for SSML next-step link on SecondDraft.
- Makes Clean + Generate SSML the visually primary SSML Builder path.
- Keeps Generate SSML from approved text available as a secondary/specialist path.
- Keeps Clean text only, Auto Chunk, Export, Clear, Copy, Edit, Read, and Stop Reading available as quieter utilities.

No text cleanup, revision, SSML generation, chunking, or approved-text preservation logic changes in this phase.

## Deferred ideas

- Full sticky action bar redesign.
- Larger homepage layout redesign.
- New onboarding tour.
- New animations or motion layer.
- Heavy component refactor.
- New JavaScript state system.
- Post-result action bars that change by completion state across every tool.
- A full shared HTML component system.
- New backend, upload, login, or API behavior.
