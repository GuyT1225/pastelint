# GitHub Repo Audit

## 1. Current README Strengths

- Clearly identified PasteLint as a browser-based text cleanup project.
- Named the major product areas: Clean, SecondDraft, SSML Builder, task pages, and the Text Readiness Framework.
- Explained the local/no-upload philosophy.
- Included the regression command.
- Gave useful background on why the project exists.

## 2. Current README Gaps

- The page was too long for a first-time repo visitor.
- Some product descriptions repeated the same ideas in several sections.
- The Clean -> Rewrite -> Prepare model appeared, but the current suite model needed a clearer tool table.
- The README did not clearly explain StatsKit analytics as page/event analytics rather than pasted-text capture.
- Reporting paths for Journal source signals, cleanup examples, and technical bugs were not clear enough.
- Some older encoding artifacts made the repo feel less polished.

## 3. Trust Gaps

- The README needed a sharper trust statement:
  - Pasted text is processed locally in the page.
  - PasteLint has no backend for text processing.
  - No login or upload is required.
  - Analytics are not for pasted text.
- The repo should avoid claiming PasteLint is cookieless because analytics are installed.
- The repo should continue warning people not to paste confidential or sensitive text into public reports.
- The README needed a clear "What PasteLint is not" section to avoid AI humanizer or detector-bypass positioning.

## 4. Missing GitHub Repo Affordances

- No `.github` issue template directory is present.
- No dedicated issue template exists for cleanup bugs.
- No dedicated issue template exists for Text Preparation Journal source signals.
- No pull request template is present.
- No license is declared beyond `TBD`.

These are not launch blockers, but issue templates would make reports safer and more useful.

## 5. Recommended README Structure

1. Project title and one-line description.
2. Trust model.
3. What PasteLint is not.
4. Tool overview table with relative links.
5. How it works.
6. Key implementation files.
7. Local development and regression command.
8. Text Preparation Journal overview.
9. Reporting paths for email and GitHub Issues.
10. Development principles.
11. Current status.
12. License.

## 6. Recommended Issue Templates

Add later, in a small separate patch:

- Cleanup bug report
  - Tool used
  - Input type
  - What happened
  - What was expected
  - Small safe example
  - Browser/device
  - Privacy reminder
- Journal source signal
  - Source link
  - What happened
  - Why it seems like a text-prep problem
  - Related PasteLint tool
  - Privacy reminder
- Broken link / site issue
  - Page
  - Link or behavior
  - Expected destination
  - Screenshot optional

Each template should remind users not to include confidential, client, medical, legal, personal, or sensitive text.

## 7. What Not To Add Yet

- No build tooling.
- No backend/API language.
- No cloud editor positioning.
- No AI humanizer or detector-bypass framing.
- No analytics claims that imply pasted text is collected.
- No broad roadmap promises that make the project sound larger than the shipped static site.
- No issue templates until the README wording is stable.
