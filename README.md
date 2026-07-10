# PasteLint

**Prepare text before it leaves your browser.**

PasteLint is a privacy-first browser-based text preparation suite for cleaning, revising, and preparing messy copied text before reuse.

The core workflow is:

```text
Clean → Rewrite → Prepare
```

* Clean removes paste artifacts, spacing issues, hidden characters, and formatting noise.
* Rewrite uses SecondDraft for clearer local revisions while preserving meaning.
* Prepare uses SSML Builder and task pages for speech, TTS, IVR, publishing, and document workflows.

PasteLint helps repair text copied from:

* PDFs
* AI tools
* websites
* emails
* Word documents
* OCR exports
* transcripts
* IVR scripts
* accessibility workflows

Everything runs locally in the browser.

No uploads. No accounts. No APIs. No backend.

---

# Live Project

https://guyt1225.github.io/pastelint/

---

# What PasteLint Can Do

PasteLint currently helps:

* clean copied PDF text
* repair messy AI-generated formatting
* remove hidden characters
* normalize pasted text
* repair spacing and punctuation
* detect readability and narration risks
* prepare text for IVR and TTS workflows
* clean OCR and transcript formatting
* improve readability before publishing or narration

---

# Core Philosophy

PasteLint is intentionally designed as:

* browser-only
* privacy-first
* lightweight
* explainable
* accessibility-aware
* utility-focused

The goal is not to conceal authorship or evade review.

The goal is to:

* improve readability
* reduce formatting friction
* improve narration flow
* improve accessibility
* improve spoken-text usability
* preserve meaning while making text easier to reuse

PasteLint aims to feel more like a trusted public utility than a hype-driven AI product.

---

# Why This Exists

PasteLint began as a practical solution for real-world communication problems:

* messy pasted text
* IVR narration cleanup
* accessibility formatting
* speech synthesis preparation
* AI-generated text cleanup
* PDF and OCR formatting repair

The project continues to evolve through real operational workflows rather than artificial demo scenarios.

---

# Current Tools

## PasteLint Clean

Cleans messy pasted text and formatting problems.

Current capabilities include:

* extra spacing cleanup
* punctuation spacing repair
* hidden character detection
* smart quote normalization
* repeated word detection
* typo correction
* line ending normalization
* paragraph cleanup
* narration-aware symbol detection
* speech-risk detection

The system also includes:

* Text Brief
* What PasteLint Found
* Edit Map
* Visual cleanup preview

---

## Clean ChatGPT Output

Cleans ChatGPT text before sending, publishing, revising, or reusing it.

Focus areas include:

* filler phrase cleanup
* formatting noise removal
* readability checks
* browser-only copy and cleanup flow
* handoff into SecondDraft

---

## SecondDraft

SecondDraft improves readability, tone, rhythm, and flow while preserving the original meaning.

The goal is restrained revision rather than aggressive rewriting.

Current and planned areas of focus include:

* filler reduction
* readability improvement
* sentence rhythm balancing
* structure smoothing
* accessibility-aware rewriting
* narration-aware cadence
* tone controls
* paragraph reflow

SecondDraft is intentionally designed to avoid:

* synonym spinning
* authorship evasion
* meaning distortion
* over-polished AI tone

---

## SSML Builder

SSML Builder prepares text for:

* Amazon Polly
* IVR systems
* narration workflows
* screen readers
* speech synthesis
* accessibility systems

Current features include:

* Polly-safe formatting
* DB number normalization
* chunk generation
* speech pacing cleanup
* special character normalization
* narration-safe structure cleanup
* readable spoken formatting

The builder was originally developed to support real-world public library IVR systems and accessibility-focused narration workflows.

---

## Task Cleanup Pages

PasteLint also includes focused task pages:

* PDF paste cleanup - repair copied PDF text without uploading files.
* Hidden character cleanup - remove zero-width characters, hard spaces, and invisible formatting noise.
* TTS text cleanup - prepare text before read-aloud, narration, or speech tools.
* IVR text prep - clean scripts, contact information, and menu wording before final audio.
* Clean text message - tidy short messages before sending.
* Text Readiness Framework - explains the Clean → Rewrite → Prepare model.

---

# Current Analyzer Capabilities

The shared analyzer layer currently detects:

* hidden characters
* excessive spacing
* filler phrases
* repeated words
* long sentences
* punctuation issues
* speech risks
* narration formatting risks
* accessibility-related readability concerns

Current speech-related detection includes:

* ampersands
* at-symbols
* slash characters
* em dashes
* en dashes
* overly long sentences
* narration pacing risks

The analyzer is gradually becoming a shared intelligence layer across the platform.

---

# Architecture

PasteLint uses a modular browser-only architecture.

No frameworks.
No backend.
No build tools.
No APIs.

Current shared infrastructure includes:

```text
/js/text-clean-engine.js
/js/text-analyzer.js
```

The project is gradually moving toward a more reusable shared-engine architecture across cleanup, readability, narration, and accessibility workflows.

Long-term architectural goals include:

```text
shared cleanup engines
shared analyzers
reusable cleanup profiles
page-specific controllers
browser-native processing
```

The overall goal is stable, understandable, reusable text infrastructure shared across all tools.

---

# Regression Checks

PasteLint includes a no-dependency regression harness for recent cleanup, rewrite, and SSML behavior.

Run:

```text
node tests/regression.js
```

The checks cover hidden-character spacing, PDF paste reflow, SecondDraft rewrite seams, SSML contact cleanup, and approved-text SSML generation.

---

# Accessibility Goals

Future development strongly considers:

* screen-reader workflows
* auditory cognition
* low-vision usability
* read-aloud fatigue
* spoken chunking
* narration pacing
* cognitive readability
* accessibility-aware formatting

The goal is to optimize text not only visually, but auditorily.

---

# Design Goals

PasteLint intentionally avoids:

* flashy AI startup aesthetics
* opaque black-box rewriting
* aggressive marketing language
* over-engineered interfaces

The intended experience is:

* calm
* clean
* trustworthy
* transparent
* utility-focused
* understandable
* explainable

---

# Privacy

PasteLint processes text locally in the browser.

That means:

* no uploads
* no account creation
* no cloud processing
* no hidden API calls
* no server-side text storage

Your text stays on your device.

---

# Project Direction

PasteLint is gradually expanding beyond basic text cleanup into broader readability and narration-oriented cleanup workflows.

Current areas of focus include:

* accessibility-aware formatting
* narration-safe cleanup
* speech-risk analysis
* reusable readability infrastructure
* explainable cleanup systems
* browser-native processing
* AI-era utility discoverability

Future improvements may include additional narration, accessibility, and spoken-text preparation workflows.

---

# Development Principles

The project follows a deliberately conservative engineering philosophy:

* local-only processing
* minimal dependencies
* modular architecture
* explainable changes
* transparent cleanup
* reusable engines
* safe incremental refactoring
* browser-native reliability

The goal is boringly safe, stable, understandable software.

---

# Status

PasteLint is actively under development.

Current work includes:

* modular engine refactoring
* analyzer expansion
* shared infrastructure extraction
* narration-aware cleanup systems
* accessibility-focused improvements
* UI stabilization
* reusable cleanup profiles

---

# License

TBD
