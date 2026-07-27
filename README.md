# PasteLint

Browser-only text preparation for copied, generated, and speech-ready text.

PasteLint helps clean and prepare text before it becomes a post, script, prompt, voiceover, support reply, document, SSML file, or IVR recording.

Live demo: <https://guyt1225.github.io/pastelint/> | [Text Preparation Journal](text-preparation-journal.html) | [Report an edge case](contact.html) | Repo: <https://github.com/GuyT1225/pastelint>

## Workflow

PasteLint follows one browser-only preparation path:

**Paste -> Clean -> Revise -> Prepare**

1. **Paste** copied, generated, drafted, or exported text.
2. **Clean** deterministic formatting and transfer problems.
3. **Revise** with Second Draft's bounded editorial patterns and options.
4. **Prepare** reviewed text for its destination, including an exact handoff to SSML Builder.

Clean and Revise are intentionally different. Clean performs mechanical normalization such as hidden-character, spacing, punctuation, and line-ending repair. Second Draft changes wording only through finite patterns and substitutions. It is not a model-backed rewrite or semantic summarization system.

## Trust Model

PasteLint is a static GitHub Pages project.

- Runs in the browser
- No login
- No upload
- No backend
- No API
- Pasted text stays in the browser
- Analytics are used for basic page/event understanding, not pasted text

Do not paste confidential, client, medical, legal, personal, or sensitive text into public reports or GitHub issues. Small anonymized examples are best.

## What PasteLint Is Not

- Not an AI humanizer
- Not detector bypass
- Not a grammar subscription
- Not a cloud editor
- Not a place to paste confidential text for review

PasteLint is for cleanup, review, and preparation before text moves into the next system.

## Tools

| Tool/page | What it prepares | Link |
| --- | --- | --- |
| PasteLint Clean | General copied text, paste artifacts, hidden characters, spacing, and formatting noise | [index.html](index.html) |
| Clean ChatGPT Output | Generated drafts with filler, inflated phrasing, rough spacing, or paste noise | [clean-chatgpt-output.html](clean-chatgpt-output.html) |
| Fix PDF Paste | Text copied from PDFs with broken line breaks or paragraph flow | [fix-pdf-paste.html](fix-pdf-paste.html) |
| Remove Hidden Characters | Zero-width characters, hard spaces, and invisible formatting residue | [remove-hidden-characters.html](remove-hidden-characters.html) |
| Clean Text Message | Short messages, quick emails, and mobile drafts | [clean-text-message.html](clean-text-message.html) |
| SecondDraft | Bounded deterministic revision options for tone, length, and structure | [second-draft.html](second-draft.html) |
| SSML Builder | Speech-ready text, XML escaping, DB numbers, chunks, and SSML handoff | [SSML_builder.html](SSML_builder.html) |
| TTS Text Cleanup | Read-aloud text before narration, TTS, or SSML | [tts-text-cleanup.html](tts-text-cleanup.html) |
| IVR Text Prep | Phone menu copy, contact info, and public-service scripts | [ivr-text-prep.html](ivr-text-prep.html) |
| Text Readiness Framework | The broader Paste -> Clean -> Revise -> Prepare model | [text-readiness-framework.html](text-readiness-framework.html) |
| Text Preparation Journal | Field notes, writing rules, and engine notes from real cleanup cases | [text-preparation-journal.html](text-preparation-journal.html) |

## How It Works

At a high level:

1. Browser-side JavaScript cleans pasted text locally.
2. The user reviews the mechanical cleanup.
3. Second Draft can apply bounded pattern, phrase, tone, length, and structure revisions.
4. Visible revision notes report observed changes; internal rule matches connect selected transformations to stable registry IDs.
5. Prepare for SSML transfers the exact revised output, or the input when no revised output exists.
6. SSML Builder can explicitly clean, generate, XML-escape, preview, and chunk speech-ready text.
7. Regression tests protect known cleanup, revision, transfer, and SSML invariants.

PasteLint does not need a server to process pasted text.

## Current Engine Boundaries

- The Second Draft rule registry describes behavior; it does not execute transformations.
- If registry metadata cannot load or validate, Second Draft continues with an empty metadata lookup.
- Existing paragraph blocks survive ordinary revision. Optional reflow treats each non-empty line as a paragraph and reports reflow only when paragraph count changes.
- Notification-frame rules remove complete known frames and retain the tested main statement, negation, conditions, protected values, and following text.
- Direct tone is a finite set of deterministic patterns, not a universal tone model.
- Shorter removes defined filler and later exact normalized eligible sentence repetitions. It does not summarize, detect paraphrases, merge similar ideas, or rank importance.
- Preservation claims are backed by regression fixtures and bounded patterns, not a universal semantic guarantee.

See [Engine Architecture](docs/engine-architecture.md) for the exact behavior and [Engine Changelog](docs/engine-changelog.md) for the completed cycle.

## Key Implementation Files

| File | Purpose |
| --- | --- |
| [js/text-clean-engine.js](js/text-clean-engine.js) | Shared cleanup rules for pasted text, hidden characters, PDF reflow, spacing, and related cleanup behavior |
| [js/text-analyzer.js](js/text-analyzer.js) | Shared analysis helpers for detecting text issues and reporting what changed |
| [js/script.js](js/script.js) | Main PasteLint Clean and shared task-page controller behavior |
| [js/second-draft.js](js/second-draft.js) | SecondDraft revision, brief, and local rewrite-support behavior |
| [js/second-draft-rule-registry.js](js/second-draft-rule-registry.js) | Rule-registry validation, active lookup, loading, and safe fallback |
| [data/second-draft-rules.json](data/second-draft-rules.json) | Canonical Second Draft rule metadata and stable rule IDs |
| [js/ssml-builder.js](js/ssml-builder.js) | SSML Builder cleanup, XML escaping, speech-safe formatting, and chunking logic |
| [js/themes.js](js/themes.js) | Light, Dark, and Terminal theme switching |
| [tests/regression.js](tests/regression.js) | No-dependency regression checks for cleanup, SecondDraft, and SSML behavior |

## Engine Documentation

| Document | Purpose |
| --- | --- |
| [docs/engine-architecture.md](docs/engine-architecture.md) | Current stage boundaries, data flow, safeguards, invariants, and limitations |
| [docs/second-draft-editorial-rulebook.md](docs/second-draft-editorial-rulebook.md) | Stable-ID policy and rule-registry governance |
| [docs/engine-changelog.md](docs/engine-changelog.md) | Completed engine cycles, user-visible effects, tests, and known limitations |
| [QA_CHECKLIST.md](QA_CHECKLIST.md) | Manual page checks and automated regression guidance |

## Local Development

Serve the static site locally:

```powershell
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

Run the regression suite:

```powershell
node tests/regression.js
```

There is no build step.

## Text Preparation Journal

The Text Preparation Journal is PasteLint's public notebook for text cleanup work.

Tracks:

- Sources & Case Studies: real examples of text problems found in posts, tools, search behavior, and production work
- Editor's Desk: writing and editing rules used by PasteLint Clean and SecondDraft
- Engine Room: cleanup rules and SSML fixes that came from real testing

The Journal is not a generic writing blog. It documents text-prep problems that affect reuse, revision, publishing, speech, SSML, IVR, and related handoffs.

## Reporting Feedback, Source Signals, And Bugs

Friendly/nontechnical notes can go to:

```text
contact.pastelint@gmail.com
```

GitHub Issues are public and are best for repeatable bugs, broken links, cleanup edge cases, and technical reports:

<https://github.com/GuyT1225/pastelint/issues>

Useful reports are usually small:

```text
Tool used:
Input type:
What happened:
What you expected:
Small safe example:
Browser/device, if relevant:
```

For Journal source signals:

```text
Source link:
What happened:
Why it seems like a text-prep problem:
Related tool, if any:
```

Please do not send confidential, client, medical, legal, personal, or sensitive text. Summaries and anonymized examples are best.

## Development Principles

PasteLint development is intentionally conservative:

- Browser-native first
- Minimal dependencies
- No backend text processing
- Explainable cleanup rules
- Regression coverage for production-discovered edge cases
- Small, reviewable changes

The goal is boringly safe, useful text infrastructure.

## Status

PasteLint is actively developed and used as a live browser-only text preparation suite.

Recent work has focused on:

- Second Draft rule-registry metadata and safe fallback
- Structural and tested protected-value preservation
- Truthful paragraph-reflow reporting
- Notification-frame and negation safeguards
- Exact Second Draft to SSML Builder transfer
- Exact repeated-sentence reduction in Shorter mode

Shorter remains deliberately narrow: it removes defined filler and later exact eligible sentence repetitions, not broad semantic redundancy.

## License

TBD
