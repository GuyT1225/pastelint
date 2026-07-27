# PasteLint Phase 1 QA

This checklist preserves the original manual browser checks and adds the automated regression workflow used for current engine changes.

## Automated Regression

Run from the project root:

```powershell
node tests/regression.js
```

The command must exit successfully and end with `All regression checks passed.`

Current automated coverage includes:

- hidden-character recovery and homepage smoke behavior
- empty-input status behavior
- PDF paragraph reflow
- Second Draft deterministic rewrites
- Shorter-mode exact repeated-sentence reduction and its exclusions
- Second Draft rule-registry validation, lookup, stable mappings, and safe fallback
- unchanged revision output when registry metadata is present
- paragraph preservation and truthful reflow reporting
- notification-frame rewriting, negation, conditions, and tested protected values
- exact Prepare for SSML transfer and one-time SSML Builder consumption
- SSML cleanup, IVR formatting, XML escaping, approved-text preservation, and chunking

Automated checks protect exact fixtures and invariants. They do not replace browser checks for rendering, focus, clipboard permissions, themes, responsive layout, or assistive status announcements.

## Counters

- [ ] Input chars update live
- [ ] Input words update live
- [ ] Output chars update after Clean
- [ ] Output words update after Clean
- [ ] Counters reset after Clear

## Cleanup

- [ ] Standard cleanup works
- [ ] Paragraph mode works
- [ ] Line mode works
- [ ] Empty input safe
- [ ] Large input safe
- [ ] Repeated words handled
- [ ] Typo cleanup safe
- [ ] Extra spaces normalized
- [ ] Punctuation spacing fixed

## Panels

- [ ] Text Brief refreshes
- [ ] What PasteLint Found refreshes
- [ ] Edit Map refreshes
- [ ] Visual Preview refreshes
- [ ] Empty states show correctly

## Actions

- [ ] Copy button works
- [ ] Clear resets everything
- [ ] Refresh page safe
- [ ] No stale output

## Second Draft

- [ ] Natural, Concise, Professional, Friendly, and Direct options load
- [ ] Direct changes only recognized finite patterns
- [ ] Keep similar, Shorter, and Expand slightly options load
- [ ] Shorter removes a tested later exact repeated sentence
- [ ] Shorter preserves a similar but non-identical sentence
- [ ] Existing paragraph breaks survive revision
- [ ] Reflow adds paragraph breaks only when selected
- [ ] Reflow note appears only after an actual paragraph-count change
- [ ] Why it works refreshes with visible change strings
- [ ] What changed refreshes with before-and-after edits
- [ ] Prepare for SSML prefers revised output and falls back to input

## SSML Builder

- [ ] Transferred text loads when SSML input is empty
- [ ] Existing SSML input is not overwritten by a pending transfer
- [ ] Clean Text Only keeps cleaned text reviewable
- [ ] Generate SSML from approved text escapes XML-sensitive characters
- [ ] Generate from cleaned text uses the reviewed cleaned field
- [ ] Chunk controls produce reviewable text and SSML chunks
- [ ] Empty actions show a clear status

## UI

- [ ] Light theme
- [ ] Dark theme
- [ ] Terminal theme
- [ ] Theme persists refresh

## Console

- [ ] No JS errors
- [ ] No null refs
- [ ] No renderer errors
