# PasteLint

Browser-only text preparation for copied, generated, and speech-ready text.

PasteLint helps clean and prepare text before it becomes a post, script, prompt, voiceover, support reply, document, SSML file, or IVR recording.

Live site: <https://guyt1225.github.io/pastelint/>

Repository: <https://github.com/GuyT1225/pastelint>

## Trust Model

PasteLint is a static GitHub Pages project.

- Runs in the browser
- No login
- No upload
- No backend
- No API
- Pasted text is processed locally in the page
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
| SecondDraft | Reviewable revision options for tone, length, and structure | [second-draft.html](second-draft.html) |
| SSML Builder | Speech-ready text, XML escaping, DB numbers, chunks, and SSML handoff | [SSML_builder.html](SSML_builder.html) |
| TTS Text Cleanup | Read-aloud text before narration, TTS, or SSML | [tts-text-cleanup.html](tts-text-cleanup.html) |
| IVR Text Prep | Phone menu copy, contact info, and public-service scripts | [ivr-text-prep.html](ivr-text-prep.html) |
| Text Readiness Framework | The broader Clean -> Rewrite -> Prepare model | [text-readiness-framework.html](text-readiness-framework.html) |
| Text Preparation Journal | Field notes, writing rules, and engine notes from real cleanup cases | [text-preparation-journal.html](text-preparation-journal.html) |

## How It Works

At a high level:

1. Text is pasted into a page.
2. Browser-side JavaScript detects cleanup issues.
3. Cleaned output is generated locally.
4. The user reviews and copies the result.
5. SSML Builder can clean, generate, escape, and chunk speech-ready text.
6. Regression tests protect known cleanup, rewrite, and SSML rules.

PasteLint does not need a server to process pasted text.

## Key Implementation Files

| File | Purpose |
| --- | --- |
| [js/text-clean-engine.js](js/text-clean-engine.js) | Shared cleanup rules for pasted text, hidden characters, PDF reflow, spacing, and related cleanup behavior |
| [js/text-analyzer.js](js/text-analyzer.js) | Shared analysis helpers for detecting text issues and reporting what changed |
| [js/script.js](js/script.js) | Main PasteLint Clean and shared task-page controller behavior |
| [js/second-draft.js](js/second-draft.js) | SecondDraft revision, brief, and local rewrite-support behavior |
| [js/ssml-builder.js](js/ssml-builder.js) | SSML Builder cleanup, XML escaping, speech-safe formatting, and chunking logic |
| [js/themes.js](js/themes.js) | Light, Dark, and Terminal theme switching |
| [tests/regression.js](tests/regression.js) | No-dependency regression checks for cleanup, SecondDraft, and SSML behavior |

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

- Hidden-character word-boundary recovery
- PDF paste reflow
- Empty-input status clarity
- SSML large-script cleanup
- SSML catalog record chunking
- Journal notes for source-led cleanup lessons

## License

TBD
